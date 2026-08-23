"use client";

import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  billingService,
  formatMoney,
  type Subscription,
  type UsageLimit,
} from "@/services/billing";

export default function AdminBillingPage() {
  const {
    data: subscription,
    isLoading: loadingPlan,
    error: planError,
  } = useSWR("/admin/billing/subscription", () => billingService.subscription(), {
    shouldRetryOnError: false,
  });

  const { data: usage, error: usageError } = useSWR(
    "/admin/billing/usage",
    () => billingService.usage(),
    { shouldRetryOnError: false },
  );

  const error = planError ?? usageError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground text-sm">
          Your plan, what you are using, and your invoices. Changes to a plan
          are made by the platform team.
        </p>
      </div>

      {error != null && (
        <FormAlert
          message={
            error instanceof ApiError ? error.message : "Failed to load billing"
          }
        />
      )}

      {loadingPlan && <Card className="p-6 text-sm">Loading…</Card>}

      {!loadingPlan && subscription == null && (
        <Card className="p-6">
          <p className="text-sm">No subscription is on record for this store.</p>
        </Card>
      )}

      {subscription != null && <PlanCard subscription={subscription} />}

      {usage != null && (
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Usage</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {usage.limits.map((limit) => (
              <UsageMeter key={limit.feature} limit={limit} />
            ))}
          </div>

          <div>
            <h3 className="mt-2 mb-2 text-sm font-medium">Features</h3>
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {usage.flags.map((flag) => (
                <li key={flag.feature} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block size-2 rounded-full",
                      flag.enabled ? "bg-emerald-500" : "bg-muted-foreground/40",
                    )}
                  />
                  <span
                    className={cn(!flag.enabled && "text-muted-foreground")}
                  >
                    {flag.label}
                  </span>
                  <span className="sr-only">
                    {flag.enabled ? "included" : "not included"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Link href="/admin/billing/invoices" className="inline-block text-sm underline">
        View invoices
      </Link>
    </div>
  );
}

function PlanCard({ subscription }: { subscription: Subscription }) {
  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {subscription.package?.name ?? "Subscription"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {formatMoney(subscription.price, subscription.currency)} ·{" "}
            {subscription.billing_period_label}
          </p>
        </div>

        <StatusBadge subscription={subscription} />
      </div>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {subscription.trial_ends_at && (
          <Detail label="Trial ends" value={formatDate(subscription.trial_ends_at)} />
        )}
        <Detail
          label="Current period"
          value={`${formatDate(subscription.current_period_start)} — ${formatDate(subscription.current_period_end)}`}
        />
        {subscription.status === "past_due" && (
          <Detail
            label="Grace period"
            value={`${subscription.grace_days} days from the due date`}
          />
        )}
        {subscription.cancelled_at && (
          <Detail label="Cancelled" value={formatDate(subscription.cancelled_at)} />
        )}
      </dl>
    </Card>
  );
}

function StatusBadge({ subscription }: { subscription: Subscription }) {
  const tone =
    subscription.status === "active"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : subscription.status === "trialing"
        ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
        : subscription.grants_service
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
          : "bg-destructive/15 text-destructive";

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-medium", tone)}>
      {subscription.status_label}
    </span>
  );
}

function UsageMeter({ limit }: { limit: UsageLimit }) {
  // Unlimited has no meaningful bar to draw, so it gets a count instead of a
  // meter that would always look empty.
  const percent =
    limit.limit === null || limit.limit === 0
      ? null
      : Math.min(100, Math.round((limit.used / limit.limit) * 100));

  const atCeiling = percent !== null && percent >= 100;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>{limit.label}</span>
        <span className={cn("tabular-nums", atCeiling && "text-destructive font-medium")}>
          {limit.unlimited
            ? `${limit.used} · unlimited`
            : `${limit.used} / ${limit.limit}`}
        </span>
      </div>

      {percent !== null && (
        <div
          className="bg-muted h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={limit.label}
        >
          <div
            className={cn(
              "h-full rounded-full",
              atCeiling
                ? "bg-destructive"
                : percent >= 80
                  ? "bg-amber-500"
                  : "bg-primary",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 sm:block">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}
