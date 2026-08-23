"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { usePlatformAuth } from "@/components/platform/platform-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/services/billing";
import { canPlatform, platformService } from "@/services/platform";
import { TenantStatusBadge } from "../page";

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = usePlatformAuth();

  const [notice, setNotice] = useState<{ tone: "error" | "success"; message: string } | null>(
    null,
  );

  const { data: tenant, mutate, isLoading } = useSWR(
    `/platform/tenants/${id}`,
    () => platformService.tenant(id),
    { shouldRetryOnError: false },
  );

  const { data: usage } = useSWR(
    tenant?.is_active ? `/platform/tenants/${id}/usage` : null,
    () => platformService.tenantUsage(id),
    { shouldRetryOnError: false },
  );

  const { data: admins } = useSWR(
    tenant?.is_active ? `/platform/tenants/${id}/admins` : null,
    () => platformService.tenantAdmins(id),
    { shouldRetryOnError: false },
  );

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice(null);

    try {
      await action();
      await mutate();
      setNotice({ tone: "success", message: success });
    } catch (e) {
      setNotice({
        tone: "error",
        message: e instanceof ApiError ? e.displayMessage : "Something went wrong",
      });
    }
  }

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (!tenant) return <FormAlert message="Tenant not found" />;

  const subscription = tenant.subscription ?? null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/super-admin/tenants" className="text-muted-foreground text-sm underline">
          Back to tenants
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <TenantStatusBadge status={tenant.status} />
        </div>

        <p className="text-muted-foreground font-mono text-sm">
          {tenant.primary_domain ?? tenant.slug} · {tenant.database}
        </p>
      </div>

      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      {tenant.status === "provision_failed" && (
        <Card className="border-destructive/30 space-y-3">
          <CardTitle>Provisioning failed</CardTitle>
          <p className="text-muted-foreground font-mono text-xs">{tenant.provision_error}</p>
          {canPlatform(user, "tenant.create") && (
            <Button
              onClick={() =>
                run(() => platformService.retryProvisioning(id), "Provisioning restarted")
              }
            >
              Retry provisioning
            </Button>
          )}
        </Card>
      )}

      {tenant.status === "suspended" && (
        <Card className="border-amber-500/30 space-y-3">
          <CardTitle>Suspended</CardTitle>
          <p className="text-sm">{tenant.suspension_reason}</p>
          {canPlatform(user, "tenant.suspend") && (
            <Button
              onClick={() => run(() => platformService.restoreTenant(id), "Tenant restored")}
            >
              Restore
            </Button>
          )}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle>Subscription</CardTitle>

          {subscription ? (
            <dl className="space-y-2 text-sm">
              <Row label="Plan" value={subscription.package?.name ?? "—"} />
              <Row
                label="Price"
                value={`${formatMoney(subscription.price, subscription.currency)} · ${subscription.billing_period_label}`}
              />
              <Row label="Status" value={subscription.status_label} />
              {subscription.trial_ends_at && (
                <Row
                  label="Trial ends"
                  value={new Date(subscription.trial_ends_at).toLocaleDateString()}
                />
              )}
              {subscription.current_period_end && (
                <Row
                  label="Renews"
                  value={new Date(subscription.current_period_end).toLocaleDateString()}
                />
              )}
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">No plan assigned.</p>
          )}
        </Card>

        <Card className="space-y-3">
          <CardTitle>Contact</CardTitle>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={tenant.contact_name ?? "—"} />
            <Row label="Email" value={tenant.contact_email ?? "—"} />
            <Row label="Phone" value={tenant.contact_phone ?? "—"} />
            <Row label="Timezone" value={tenant.timezone} />
            <Row label="Currency" value={tenant.currency} />
          </dl>
        </Card>
      </div>

      {usage && (
        <Card className="space-y-3">
          <CardTitle>Usage</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {usage.limits.map((limit) => (
              <div key={limit.feature} className="flex justify-between text-sm">
                <span>{limit.label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    !limit.unlimited &&
                      limit.limit !== null &&
                      limit.used >= limit.limit &&
                      "text-destructive font-medium",
                  )}
                >
                  {limit.unlimited ? `${limit.used} · unlimited` : `${limit.used} / ${limit.limit}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Domains</CardTitle>

        <ul className="divide-y text-sm">
          {tenant.domains?.map((domain) => (
            <li key={domain.id} className="flex items-center justify-between gap-3 py-2">
              <span className="font-mono">
                {domain.hostname}
                {domain.is_primary && (
                  <span className="text-muted-foreground ml-2 text-xs">primary</span>
                )}
                {!domain.is_verified && !domain.is_primary && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    unverified
                  </span>
                )}
              </span>

              {canPlatform(user, "tenant.update") && !domain.is_primary && (
                <span className="flex gap-3">
                  <button
                    className="underline"
                    onClick={() =>
                      run(
                        () => platformService.makeDomainPrimary(id, domain.id),
                        "Primary domain updated",
                      )
                    }
                  >
                    Make primary
                  </button>
                  <button
                    className="text-destructive underline"
                    onClick={() =>
                      run(() => platformService.removeDomain(id, domain.id), "Domain removed")
                    }
                  >
                    Remove
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>

        {canPlatform(user, "tenant.update") && (
          <AddDomainForm
            onAdd={(hostname) =>
              run(() => platformService.addDomain(id, hostname), "Domain added")
            }
          />
        )}
      </Card>

      {admins && (
        <Card className="space-y-3">
          <CardTitle>Store admins</CardTitle>

          <ul className="divide-y text-sm">
            {admins.items.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {admin.name}
                  <span className="text-muted-foreground"> · {admin.email}</span>
                </span>

                {canPlatform(user, "tenant.impersonate") && tenant.is_active && (
                  <ImpersonateButton tenantId={id} userId={admin.id} onError={setNotice} />
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <DangerZone tenant={tenant} onRun={run} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function AddDomainForm({ onAdd }: { onAdd: (hostname: string) => Promise<void> }) {
  const [hostname, setHostname] = useState("");

  return (
    <form
      className="flex gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        await onAdd(hostname);
        setHostname("");
      }}
    >
      <input
        value={hostname}
        onChange={(event) => setHostname(event.target.value)}
        placeholder="shop.example.com"
        className="border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm"
      />
      <Button type="submit" variant="secondary" disabled={!hostname}>
        Add domain
      </Button>
    </form>
  );
}

/**
 * Impersonation asks for a reason before it will do anything: it is a
 * privacy-sensitive act, and "why" belongs on the record before the fact.
 */
function ImpersonateButton({
  tenantId,
  userId,
  onError,
}: {
  tenantId: number;
  userId: number;
  onError: (notice: { tone: "error"; message: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <button className="underline" onClick={() => setOpen(true)}>
        Open store admin
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (recorded)"
        className="border-input bg-background h-8 w-56 rounded-md border px-2 text-sm"
      />
      <Button
        className="h-8"
        loading={loading}
        disabled={!reason}
        onClick={async () => {
          setLoading(true);

          try {
            const { url } = await platformService.impersonate(tenantId, userId, reason);
            // The token lives for 60 seconds, so it is followed immediately
            // rather than shown to be copied around.
            window.location.href = url;
          } catch (e) {
            onError({
              tone: "error",
              message: e instanceof ApiError ? e.displayMessage : "Could not start session",
            });
            setLoading(false);
          }
        }}
      >
        Go
      </Button>
      <button className="text-muted-foreground underline" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </span>
  );
}

function DangerZone({
  tenant,
  onRun,
}: {
  tenant: { id: number; slug: string; status: string };
  onRun: (action: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const { user } = usePlatformAuth();
  const [reason, setReason] = useState("");
  const [confirmSlug, setConfirmSlug] = useState("");

  const canSuspend = canPlatform(user, "tenant.suspend") && tenant.status === "active";
  const canArchive = canPlatform(user, "tenant.delete") && tenant.status !== "archived";

  if (!canSuspend && !canArchive) return null;

  return (
    <Card className="border-destructive/30 space-y-5">
      <CardTitle className="text-destructive">Danger zone</CardTitle>

      {canSuspend && (
        <div className="space-y-2">
          <Field
            label="Suspend this store"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason (required, recorded)"
          />
          <Button
            variant="destructive"
            disabled={!reason}
            onClick={() =>
              onRun(() => platformService.suspendTenant(tenant.id, reason), "Tenant suspended")
            }
          >
            Suspend
          </Button>
        </div>
      )}

      {canArchive && (
        <div className="space-y-2">
          <Field
            label={`Archive — type "${tenant.slug}" to confirm`}
            value={confirmSlug}
            onChange={(event) => setConfirmSlug(event.target.value)}
            placeholder={tenant.slug}
          />
          <p className="text-muted-foreground text-xs">
            The store stops serving immediately. Its database is kept for the retention
            window and then permanently destroyed.
          </p>
          <Button
            variant="destructive"
            disabled={confirmSlug !== tenant.slug}
            onClick={() =>
              onRun(
                () => platformService.archiveTenant(tenant.id, confirmSlug),
                "Tenant archived",
              )
            }
          >
            Archive
          </Button>
        </div>
      )}
    </Card>
  );
}
