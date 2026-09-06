/**
 * Validated access to environment variables.
 * Fail fast at startup instead of producing broken fetch URLs at runtime.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name} (set it in .env.local)`,
    );
  }
  return value;
}

export const env = {
  /** Base URL of the Laravel API, including the /api/v1 prefix. */
  apiUrl: required("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL),

  /**
   * Stands in for a subdomain during local development, where the app is
   * served from localhost rather than <slug>.platform.test. Unset in
   * production — there the Host header is the only tenant identity, and the
   * API refuses the header fallback outright.
   */
  devTenant: process.env.NEXT_PUBLIC_DEV_TENANT || undefined,

  /** Hosts that mean "no tenant"; mirrors TENANCY_CENTRAL_DOMAINS. */
  centralHosts: process.env.NEXT_PUBLIC_CENTRAL_HOSTS || undefined,

  /**
   * Host that tenant subdomains are minted under; mirrors TENANCY_BASE_DOMAIN.
   *
   * The portal composes every address it displays from this rather than
   * hardcoding one, so a deployment cannot be shown an address it never minted
   * (PRD 3C rule 20).
   */
  tenantBaseDomain:
    process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || "platform.test",
};
