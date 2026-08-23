import { env } from "./env";

/**
 * Which store is this page serving?
 *
 * Mirrors the API's resolution rules (docs/architecture/TENANCY.md §4) so the
 * browser and the server agree on the answer:
 *
 *   acme.platform.test   -> "acme"
 *   platform.test        -> null   (central: the Super Admin Portal)
 *   localhost:3000       -> NEXT_PUBLIC_DEV_TENANT, if set
 *
 * The API never trusts this value — it resolves the tenant itself from the
 * request host. What is sent here is a development convenience so a single
 * `localhost:3000` dev server can stand in for a subdomain.
 */

/** Hosts that mean "no tenant". Kept in step with TENANCY_CENTRAL_DOMAINS. */
const CENTRAL_HOSTS = new Set(
  (env.centralHosts ?? "platform.test,admin.platform.test,localhost,127.0.0.1")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0].replace(/\.$/, "");
}

export function isCentralHost(host: string): boolean {
  return CENTRAL_HOSTS.has(normalizeHost(host));
}

/**
 * Derive the tenant slug from a hostname, or null for a central host.
 * Exported separately from the browser helper so server components and
 * middleware can pass the incoming Host header straight in.
 */
export function tenantFromHost(host: string): string | null {
  const hostname = normalizeHost(host);

  if (!hostname || isCentralHost(hostname)) {
    return env.devTenant ?? null;
  }

  const [first, ...rest] = hostname.split(".");

  // A bare hostname with no dots (a custom domain in /etc/hosts, say) is not a
  // subdomain, so there is nothing to read a slug from — let the API decide.
  return rest.length > 0 && first ? first : null;
}

/** The tenant for the page currently open in the browser, if any. */
export function currentTenant(): string | null {
  if (typeof window === "undefined") {
    return env.devTenant ?? null;
  }

  return tenantFromHost(window.location.host);
}

/**
 * Header the API accepts as a stand-in for a subdomain in local development.
 * Empty in production, where the Host header carries the identity and the
 * API's header fallback is switched off entirely.
 */
export function tenantHeaders(): Record<string, string> {
  const tenant = currentTenant();

  return tenant ? { "X-Tenant": tenant } : {};
}
