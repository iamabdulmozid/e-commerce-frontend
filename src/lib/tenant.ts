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

/**
 * The central hosts a dev server actually binds to.
 *
 * A loopback host cannot express a subdomain, which is the whole reason
 * NEXT_PUBLIC_DEV_TENANT exists — so it is the only place that stand-in may be
 * applied. `platform.test` *can* express one and genuinely means central:
 * naming a tenant there would resolve one on the Super Admin Portal's own host,
 * and RequirePlatform 404s every /platform route the moment a tenant resolves.
 */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0].replace(/\.$/, "");
}

export function isCentralHost(host: string): boolean {
  return CENTRAL_HOSTS.has(normalizeHost(host));
}

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(normalizeHost(host));
}

/**
 * Derive the tenant slug from a hostname, or null for a central host.
 * Exported separately from the browser helper so server components and
 * middleware can pass the incoming Host header straight in.
 */
export function tenantFromHost(host: string): string | null {
  const hostname = normalizeHost(host);

  if (!hostname) {
    return null;
  }

  if (isCentralHost(hostname)) {
    // Only loopback is ambiguous enough to need the stand-in. Every other
    // central host means central, exactly as the table above promises.
    return isLoopbackHost(hostname) ? (env.devTenant ?? null) : null;
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

/** The address a tenant with this subdomain is reachable at. */
export function tenantHostname(subdomain: string): string {
  return `${subdomain}.${env.tenantBaseDomain}`;
}

/**
 * Browser origin for a tenant's own hostname.
 *
 * Tenant hostnames never carry a port — TenantDomain::normalize strips it,
 * because a port is not part of tenant identity. In development the storefront
 * answers on :3000, so a link built from the stored hostname alone lands on
 * port 80 and fails. Only a loopback address needs the port put back; `.localhost`
 * is the special-use TLD browsers resolve to loopback without a hosts entry.
 */
export function tenantOrigin(hostname: string): string {
  const host = normalizeHost(hostname);

  if (!host) {
    return "";
  }

  const location = typeof window === "undefined" ? null : window.location;
  const protocol = location?.protocol ?? "http:";
  const port = location?.port ?? "";
  const isLoopback = isLoopbackHost(host) || host.endsWith(".localhost");

  return `${protocol}//${host}${isLoopback && port ? `:${port}` : ""}`;
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
