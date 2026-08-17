import { env } from "./env";

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

  await fetch(`${apiOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
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
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}),
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
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
};
