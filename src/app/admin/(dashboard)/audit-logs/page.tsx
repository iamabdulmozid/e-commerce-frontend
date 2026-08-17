"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { adminService } from "@/services/admin";

export default function AdminAuditLogsPage() {
  const {
    data: entries,
    isLoading,
    error,
  } = useSWR(
    "/admin/audit-logs",
    async () => (await adminService.auditLogs({ per_page: 50 })).items,
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="text-muted-foreground text-sm">
          Append-only record of sensitive changes — who, what, when and from
          where.
        </p>
      </div>

      {error != null && (
        <FormAlert
          message={
            error instanceof ApiError
              ? error.message
              : "Failed to load audit log"
          }
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Subject</th>
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
            {entries?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  Nothing recorded yet.
                </td>
              </tr>
            )}
            {entries?.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{entry.user?.name ?? "System"}</td>
                <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                <td className="px-4 py-3">
                  {entry.auditable_type
                    ? `${entry.auditable_type} #${entry.auditable_id}`
                    : "—"}
                </td>
                <td className="text-muted-foreground max-w-sm truncate px-4 py-3 font-mono text-xs">
                  {entry.before || entry.after
                    ? `${JSON.stringify(entry.before)} → ${JSON.stringify(entry.after)}`
                    : "—"}
                </td>
                <td className="px-4 py-3">{entry.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
