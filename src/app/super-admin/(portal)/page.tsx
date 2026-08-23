"use client";

import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/services/billing";
import { platformService } from "@/services/platform";

export default function PlatformDashboardPage() {
  const { data, isLoading, error } = useSWR(
    "/platform/dashboard",
    () => platformService.dashboard(),
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          How the platform is doing, and what needs attention today.
        </p>
      </div>

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.message : "Failed to load dashboard"}
        />
      )}

      {isLoading && <Card className="p-6 text-sm">Loading…</Card>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Active tenants" value={String(data.tenants.active ?? 0)} />
            <Stat label="Monthly recurring" value={formatMoney(data.mrr, "BDT")} />
            <Stat label="Outstanding" value={formatMoney(data.outstanding_total, "BDT")} />
            <Stat
              label="Suspended"
              value={String(data.tenants.suspended ?? 0)}
              tone={(data.tenants.suspended ?? 0) > 0 ? "warning" : undefined}
            />
          </div>

          {(data.provisioning_failures.length > 0 ||
            (data.tenants.provisioning ?? 0) > 0) && (
            <Card className="space-y-3 p-6">
              <h2 className="font-semibold">Provisioning</h2>

              {(data.tenants.provisioning ?? 0) > 0 && (
                <p className="text-muted-foreground text-sm">
                  {data.tenants.provisioning} tenant(s) still building.
                </p>
              )}

              {data.provisioning_failures.map((failure) => (
                <div
                  key={failure.id}
                  className="border-destructive/30 bg-destructive/5 rounded-md border p-3 text-sm"
                >
                  <Link
                    href={`/super-admin/tenants/${failure.id}`}
                    className="font-medium underline"
                  >
                    {failure.name}
                  </Link>
                  <p className="text-muted-foreground mt-1 font-mono text-xs">
                    {failure.error}
                  </p>
                </div>
              ))}
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-6">
              <h2 className="font-semibold">Trials ending in 7 days</h2>

              {data.trials_ending_soon.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nothing ending soon.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {data.trials_ending_soon.map((trial) => (
                    <li
                      key={trial.subscription_id}
                      className="flex justify-between gap-4 py-2"
                    >
                      <Link
                        href={`/super-admin/tenants/${trial.tenant.id}`}
                        className="underline"
                      >
                        {trial.tenant.name}
                      </Link>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {trial.trial_ends_at
                          ? new Date(trial.trial_ends_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="space-y-3 p-6">
              <h2 className="font-semibold">Overdue invoices</h2>

              {data.overdue_invoices.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nothing overdue.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {data.overdue_invoices.map((invoice) => (
                    <li key={invoice.id} className="flex justify-between gap-4 py-2">
                      <span>
                        <Link
                          href={`/super-admin/invoices?tenant=${invoice.tenant.id}`}
                          className="underline"
                        >
                          {invoice.number}
                        </Link>
                        <span className="text-muted-foreground">
                          {" "}
                          · {invoice.tenant.name}
                        </span>
                      </span>
                      <span className="text-destructive tabular-nums whitespace-nowrap">
                        {formatMoney(invoice.balance, invoice.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
