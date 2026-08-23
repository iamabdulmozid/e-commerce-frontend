"use client";

import useSWR from "swr";
import { usePlatformAuth } from "@/components/platform/platform-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/services/billing";
import { canPlatform, platformService, type Package } from "@/services/platform";
import { PackageEditor } from "@/components/platform/package-editor";
import { useState } from "react";

export default function PackagesPage() {
  const { user } = usePlatformAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Package | null | undefined>(undefined);

  const { data, mutate, isLoading, error } = useSWR(
    "/platform/packages",
    () => platformService.packages(),
    { shouldRetryOnError: false },
  );

  const canManage = canPlatform(user, "package.manage");

  async function toggle(id: number) {
    setNotice(null);

    try {
      await platformService.togglePackage(id);
      await mutate();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.displayMessage : "Something went wrong");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Packages</h1>
          <p className="text-muted-foreground text-sm">
            What the platform sells. Editing a package changes future sales only — existing
            subscriptions keep the terms they were sold.
          </p>
        </div>

        {canManage && editing === undefined && (
          <Button onClick={() => setEditing(null)}>New package</Button>
        )}
      </div>

      {canManage && editing !== undefined && data && (
        <PackageEditor
          pkg={editing}
          catalog={data.catalog}
          onClose={() => setEditing(undefined)}
          onSaved={mutate}
        />
      )}

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.message : "Failed to load packages"}
        />
      )}
      {notice && <FormAlert message={notice} />}

      {isLoading && <Card className="text-sm">Loading…</Card>}

      <div className="grid gap-4 lg:grid-cols-3">
        {data?.items.map((pkg) => (
          <Card key={pkg.id} className={cn("space-y-4", !pkg.is_active && "opacity-60")}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{pkg.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {formatMoney(pkg.price, pkg.currency)} ·{" "}
                  {pkg.billing_period_label.toLowerCase()}
                </p>
              </div>

              {!pkg.is_active && (
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs">
                  inactive
                </span>
              )}
            </div>

            {pkg.description && <p className="text-sm">{pkg.description}</p>}

            <dl className="space-y-1 text-sm">
              {data.catalog.limits.map((limit) => {
                const value = pkg.features[limit.feature];

                return (
                  <div key={limit.feature} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{limit.label}</dt>
                    <dd className="tabular-nums">
                      {value === null ? "Unlimited" : String(value)}
                    </dd>
                  </div>
                );
              })}
            </dl>

            <ul className="space-y-1 text-sm">
              {data.catalog.flags.map((flag) => {
                const enabled = Boolean(pkg.features[flag.feature]);

                return (
                  <li key={flag.feature} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "inline-block size-2 rounded-full",
                        enabled ? "bg-emerald-500" : "bg-muted-foreground/40",
                      )}
                    />
                    <span className={cn(!enabled && "text-muted-foreground")}>
                      {flag.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
              <span>
                {pkg.trial_days > 0 ? `${pkg.trial_days}-day trial` : "No trial"} ·{" "}
                {pkg.subscriptions_count ?? 0} subscriber(s)
              </span>

              {canManage && (
                <span className="flex gap-3">
                  <button className="underline" onClick={() => setEditing(pkg)}>
                    Edit
                  </button>
                  <button className="underline" onClick={() => toggle(pkg.id)}>
                    {pkg.is_active ? "Deactivate" : "Activate"}
                  </button>
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
