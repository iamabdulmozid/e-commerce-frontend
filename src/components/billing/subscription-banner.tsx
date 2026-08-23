"use client";

import Link from "next/link";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { billingService, type Subscription } from "@/services/billing";

/**
 * Persistent notice in the admin shell for a plan that needs attention.
 *
 * Silent while everything is fine: a banner that is always there stops being
 * read. Trials show a countdown only in their last week, for the same reason.
 */
export function SubscriptionBanner() {
  const { data: subscription } = useSWR(
    "/admin/billing/subscription",
    () => billingService.subscription(),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  );

  const notice = subscription ? noticeFor(subscription) : null;

  if (!notice) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b px-6 py-2 text-sm",
        notice.tone === "danger" && "border-destructive/30 bg-destructive/10",
        notice.tone === "warning" && "border-amber-500/30 bg-amber-500/10",
        notice.tone === "info" && "bg-muted",
      )}
    >
      <span>{notice.message}</span>
      <Link href="/admin/billing" className="shrink-0 font-medium underline">
        View billing
      </Link>
    </div>
  );
}

interface Notice {
  tone: "info" | "warning" | "danger";
  message: string;
}

function noticeFor(subscription: Subscription): Notice | null {
  switch (subscription.status) {
    case "suspended":
      return {
        tone: "danger",
        message:
          "Your store is suspended for non-payment and is not serving customers. Settle the outstanding invoice to restore it.",
      };

    case "past_due":
      return {
        tone: "danger",
        message: `Payment is overdue. Your store will be suspended if the invoice is not settled within ${subscription.grace_days} days of the due date.`,
      };

    case "expired":
      return {
        tone: "danger",
        message: "Your trial ended without a payment. Contact us to activate a plan.",
      };

    case "cancelled":
      return {
        tone: "warning",
        message: "This subscription has been cancelled.",
      };

    case "trialing": {
      const days = daysUntil(subscription.trial_ends_at);

      if (days === null || days > 7) return null;

      return {
        tone: days <= 2 ? "warning" : "info",
        message:
          days <= 0
            ? "Your trial ends today."
            : `Your trial ends in ${days} day${days === 1 ? "" : "s"}.`,
      };
    }

    default:
      return null;
  }
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;

  const millis = new Date(date).getTime() - Date.now();

  return Math.ceil(millis / 86_400_000);
}
