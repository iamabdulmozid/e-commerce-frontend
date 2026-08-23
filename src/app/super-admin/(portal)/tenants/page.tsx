"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { usePlatformAuth } from "@/components/platform/platform-auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { canPlatform, type TenantStatus } from "@/services/platform";
import { platformService } from "@/services/platform";

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "provisioning", label: "Provisioning" },
  { value: "provision_failed", label: "Failed" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

export default function TenantsPage() {
  const { user } = usePlatformAuth();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const {
    data: tenants,
    isLoading,
    error,
  } = useSWR(
    ["/platform/tenants", status, search],
    async () => (await platformService.tenants({ status, q: search, per_page: 50 })).items,
    {
      shouldRetryOnError: false,
      // Provisioning finishes out of band, so the list refreshes itself
      // rather than making the operator reload to find out.
      refreshInterval: 10_000,
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground text-sm">
            Every store on the platform, and what state it is in.
          </p>
        </div>

        {canPlatform(user, "tenant.create") && (
          <Link href="/super-admin/tenants/new">
            <Button>New tenant</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatus(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              status === option.value ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, slug or contact"
          className="border-input bg-background ml-auto h-9 w-64 rounded-md border px-3 text-sm"
        />
      </div>

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.message : "Failed to load tenants"}
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Store</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-6">
                  Loading…
                </td>
              </tr>
            )}

            {tenants?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-6">
                  No tenants match.
                </td>
              </tr>
            )}

            {tenants?.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/super-admin/tenants/${tenant.id}`}
                    className="font-medium underline"
                  >
                    {tenant.name}
                  </Link>
                  <p className="text-muted-foreground font-mono text-xs">{tenant.slug}</p>
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {tenant.primary_domain ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {tenant.subscription?.package?.name ?? (
                    <span className="text-muted-foreground">No plan</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TenantStatusBadge status={tenant.status} />
                </td>
                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                  {tenant.created_at
                    ? new Date(tenant.created_at).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const tone: Record<TenantStatus, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    provisioning: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    provision_failed: "bg-destructive/15 text-destructive",
    suspended: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tone[status])}>
      {status.replace("_", " ")}
    </span>
  );
}
