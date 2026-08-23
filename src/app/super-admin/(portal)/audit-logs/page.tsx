"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { platformService } from "@/services/platform";

export default function PlatformAuditLogsPage() {
  const { data, isLoading, error } = useSWR(
    "/platform/audit-logs",
    async () => (await platformService.auditLogs({ per_page: 100 })).items,
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Platform audit log</h1>
        <p className="text-muted-foreground text-sm">
          Append-only record of what platform staff did to tenants. What store staff do
          inside their own store is recorded separately, in that tenant.
        </p>
      </div>

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.message : "Failed to load audit log"}
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  Loading…
                </td>
              </tr>
            )}

            {data?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  Nothing recorded yet.
                </td>
              </tr>
            )}

            {data?.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{entry.platform_user?.name ?? "System"}</td>
                <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                <td className="px-4 py-3">{entry.tenant?.slug ?? "—"}</td>
                <td className="text-muted-foreground max-w-md px-4 py-3">
                  <Diff before={entry.before} after={entry.after} />
                </td>
                <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                  {entry.ip ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/**
 * Only the keys that actually changed, so a row stays readable instead of
 * being the whole record twice.
 */
function Diff({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const keys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  );

  if (keys.length === 0) return <span>—</span>;

  return (
    <ul className="space-y-0.5 text-xs">
      {keys.slice(0, 4).map((key) => (
        <li key={key} className="truncate">
          <span className="font-medium">{key}</span>: {format(before?.[key])} →{" "}
          {format(after?.[key])}
        </li>
      ))}
      {keys.length > 4 && <li>+{keys.length - 4} more</li>}
    </ul>
  );
}

function format(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 40);

  return String(value).slice(0, 40);
}
