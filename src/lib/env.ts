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
};
