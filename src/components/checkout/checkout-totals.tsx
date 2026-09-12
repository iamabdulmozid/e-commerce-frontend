"use client";

import { formatMoney } from "@/components/catalog/price";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CheckoutQuote } from "@/services/checkout";

/**
 * The server's totals, rendered as given.
 *
 * This component deliberately contains NO arithmetic. It does not sum the
 * lines, does not derive the grand total and does not hide a zero line it
 * thinks is uninteresting - a client that reconstructs totals is a client that
 * can disagree with the server about what someone is being charged
 * (engineering rule 2).
 *
 * The zero promotion, coupon and tax lines are shown because they are real
 * information: a merchant looking at their own checkout can see that tax is
 * switched off rather than having to infer it from an absence.
 */
export function CheckoutTotals({
  quote,
  currency,
  pending = false,
}: {
  quote: CheckoutQuote | null;
  currency: string;
  pending?: boolean;
}) {
  if (!quote) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    // Dimmed rather than replaced while re-quoting: the panel jumping to a
    // skeleton on every keystroke reads as a broken page.
    <dl className={cn("space-y-2 text-sm", pending && "opacity-60")}>
      {quote.lines.map((line) => (
        <div key={line.code} className="flex justify-between">
          <dt className="text-muted-foreground">{line.label}</dt>
          <dd className="tabular-nums">
            {line.sign === "-" && line.amount !== "0.00" ? "− " : ""}
            {formatMoney(line.amount, currency)}
          </dd>
        </div>
      ))}

      <div className="border-border flex justify-between border-t pt-2 font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">
          {formatMoney(quote.grand_total, currency)}
        </dd>
      </div>
    </dl>
  );
}
