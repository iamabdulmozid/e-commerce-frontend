import { headers } from "next/headers";
import { env } from "./env";
import { tenantFromHost } from "./tenant";
import { ApiError, type ApiEnvelope } from "./api";

/**
 * Server-side API reads for SEO-critical storefront pages.
 *
 * The browser client cannot be reused here: it leans on `window.location` for
 * the tenant and on cookies for auth, and a Server Component has neither.
 *
 * Getting the tenant right on the server takes some care. The API decides
 * which store a request belongs to from the HTTP Host, and a server-side fetch
 * presents the API's host, not the shopper's. Two situations, two answers:
 *
 *   production   Next and the API sit behind the same hostname, so the request
 *                is made to the tenant's own origin and Host is correct by
 *                construction. No header trickery, and the `X-Tenant`
 *                development door stays shut (engineering rule 26).
 *
 *   development  Next is on :3000 and the API on :8000, so the Host cannot
 *                carry the tenant. NEXT_PUBLIC_DEV_TENANT names it instead -
 *                the same config-gated fallback the browser client uses.
 *
 * Only public, cacheable catalog reads belong here. Anything authenticated
 * stays in the browser, where the session cookie lives.
 */
async function serverFetch<T>(path: string, revalidate = 60): Promise<T> {
  const incoming = await headers();
  const host = incoming.get("host") ?? "";
  const tenant = tenantFromHost(host);

  const { url, tenantHeader } = resolveTarget(host, tenant, path);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...tenantHeader,
    },
    // Catalog content changes rarely and is read constantly; a short window
    // keeps a busy category page off the database without making an edit take
    // minutes to appear.
    next: { revalidate },
  });

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !envelope?.success) {
    throw new ApiError(
      envelope?.message ?? "Request failed",
      response.status,
      envelope?.errors ?? {},
      envelope?.data,
    );
  }

  return envelope.data as T;
}

function resolveTarget(host: string, tenant: string | null, path: string) {
  const apiUrl = new URL(env.apiUrl);

  // Dev: the API lives on a different port, so the tenant travels as a header.
  //
  // The HOST wins whenever it names a store. NEXT_PUBLIC_DEV_TENANT is a
  // stand-in for a subdomain that a bare `localhost` cannot express — so when
  // the shopper is already on `demo.localhost:3000`, the variable has nothing
  // left to stand in for and deferring to it would render one store's
  // catalogue inside another store's address. The browser resolves the tenant
  // from the host it is on, and this is what keeps the two halves agreeing.
  if (env.devTenant) {
    return {
      url: `${env.apiUrl}${path}`,
      tenantHeader: {
        "X-Tenant": tenant ?? env.devTenant,
      } as Record<string, string>,
    };
  }

  // Production: same hostname as the shopper, so Host resolves the tenant.
  const origin = host !== "" ? `${apiUrl.protocol}//${host}` : apiUrl.origin;

  return {
    url: `${origin}${apiUrl.pathname}${path}`,
    tenantHeader: {} as Record<string, string>,
    tenant,
  };
}

export { serverFetch };
