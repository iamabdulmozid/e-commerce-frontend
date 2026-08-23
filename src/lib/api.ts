import { env } from "./env";
import { tenantHeaders } from "./tenant";

/**
 * Typed client for the Laravel API. Understands the standard envelope:
 *   success: {success: true,  message, data}
 *   error:   {success: false, message, errors}
 *
 * Successful calls resolve with `data`; failures throw ApiError with the
 * server's message, HTTP status, and field errors — so UI code handles
 * one error shape everywhere.
 *
 * Authentication uses Sanctum's SPA mode: an httpOnly session cookie the
 * browser sends automatically. Nothing sensitive is stored in JS, but state-
 * changing requests must carry the CSRF token Laravel issued (see below).
 */

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[] | string>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[] | string> = {},
    /**
     * Structured detail some failures carry alongside the message — a plan
     * limit sends which feature, its ceiling and current usage, so the UI can
     * be specific instead of saying "Forbidden".
     */
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** First validation message for a field, if any. */
  fieldError(field: string): string | undefined {
    const value = this.errors[field];
    return Array.isArray(value) ? value[0] : value;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Machine-readable code the API attaches to tenancy/billing failures. */
  get code(): string | undefined {
    const value = this.errors.code;
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * The store exists but is not serving: provisioning, suspended, or past due.
   * Distinct from a 404 (no such store) and from a 500 (we broke something).
   */
  get isStoreUnavailable(): boolean {
    return (
      this.status === 503 &&
      (this.code === "tenant_inactive" || this.code === "subscription_suspended")
    );
  }

  /** A plan ceiling was reached. `planLimit` carries which one. */
  get isPlanLimit(): boolean {
    return this.status === 403 && this.code === "subscription.limit_exceeded";
  }

  /** A capability the current plan does not include. */
  get isPlanFeature(): boolean {
    return (
      this.status === 403 && this.code === "subscription.feature_unavailable"
    );
  }

  /**
   * Detail the API attaches to a plan refusal, so the UI can say which limit
   * was hit and what the ceiling is instead of just "Forbidden".
   */
  get planLimit():
    | { feature: string; label: string; limit?: number; used?: number }
    | undefined {
    return this.data as
      | { feature: string; label: string; limit?: number; used?: number }
      | undefined;
  }

  /** A sentence worth showing a user, whatever kind of failure this was. */
  get displayMessage(): string {
    if (this.isPlanLimit && this.planLimit) {
      const { label, limit, used } = this.planLimit;

      return `You have reached your plan limit for ${label.toLowerCase()} (${used} of ${limit}). Upgrade to add more.`;
    }

    if (this.isPlanFeature && this.planLimit) {
      return `${this.planLimit.label} is not included in your current plan.`;
    }

    return this.message;
  }
}

const apiOrigin = new URL(env.apiUrl).origin;
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/**
 * Ask Laravel to set the XSRF-TOKEN cookie. Required once before the first
 * state-changing request of a browser session.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (readCookie("XSRF-TOKEN")) return;

  // The tenant header matters here too, not just on API calls: this request
  // starts the session, and session cookie names are per-tenant. Issuing the
  // CSRF cookie in central context while every later call runs in tenant
  // context means two different session cookies and a permanent 419 loop.
  await fetch(`${apiOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json", ...tenantHeaders() },
  });
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();

  if (UNSAFE_METHODS.has(method) && typeof document !== "undefined") {
    await ensureCsrfCookie();
  }

  const csrfToken = readCookie("XSRF-TOKEN");

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        // FormData sets its own Content-Type, including the multipart
        // boundary. Overriding it produces a request the server cannot parse.
        ...(init.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}),
        // Identifies the store in local development, where the app is served
        // from localhost instead of <slug>.platform.test. Sends nothing in
        // production; there the Host header decides and the API ignores this.
        ...tenantHeaders(),
        ...init.headers,
      },
      credentials: "include",
    });
  } catch {
    throw new ApiError("API unreachable", 0);
  }

  // 419 = session/CSRF token expired. Refresh the token once and replay.
  if (response.status === 419 && !isRetry && typeof document !== "undefined") {
    document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
    await ensureCsrfCookie();
    return request<T>(path, init, true);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = await response.json();
  } catch {
    throw new ApiError("Invalid API response", response.status);
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(
      envelope.message ?? "Request failed",
      response.status,
      envelope.errors ?? {},
      envelope.data,
    );
  }

  return envelope.data as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      // A FormData body is passed through untouched; anything else is JSON.
      // `init.body` wins when no body argument was given, which is how file
      // uploads reach here.
      body:
        body instanceof FormData
          ? body
          : body === undefined
            ? init?.body
            : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
};
