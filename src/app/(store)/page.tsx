import { api, ApiError } from "@/lib/api";

interface HealthData {
  app: string;
  env: string;
  db: string;
  time: string;
}

async function getHealth(): Promise<HealthData | { error: string }> {
  try {
    return await api.get<HealthData>("/health", { cache: "no-store" });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Unknown error" };
  }
}

export default async function StoreHomePage() {
  const health = await getHealth();
  const ok = !("error" in health);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Storefront</h1>
      <p className="text-neutral-500">
        Phase 1 foundation — catalog pages arrive in Phase 4.
      </p>

      <div className="rounded-lg border p-6 text-sm">
        <h2 className="mb-3 font-semibold">API status</h2>
        {ok ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            <dt className="text-neutral-500">App</dt>
            <dd>{health.app}</dd>
            <dt className="text-neutral-500">Environment</dt>
            <dd>{health.env}</dd>
            <dt className="text-neutral-500">Database</dt>
            <dd className="text-green-600">{health.db}</dd>
            <dt className="text-neutral-500">Server time</dt>
            <dd>{health.time}</dd>
          </dl>
        ) : (
          <p className="text-red-600">
            {health.error} — is the Laravel API running? (php artisan serve)
          </p>
        )}
      </div>
    </main>
  );
}
