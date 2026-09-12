"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { formatMoney } from "@/components/catalog/price";
import { CollectCodDialog } from "@/components/payments/collect-cod-dialog";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  paymentService,
  type Payment,
  type PaymentState,
} from "@/services/payments";

/**
 * Payments, with cash-on-delivery reconciliation on top.
 *
 * The reconciliation panel leads because it is the daily job: a COD store
 * manager opens this to find out what is still out with riders and to settle
 * what came back. The payment list underneath is the archive.
 */
const FILTERS: { value: PaymentState | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Awaiting payment" },
  { value: "success", label: "Paid" },
  { value: "cancelled", label: "Not collected" },
];

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState<PaymentState | "">("");
  const [term, setTerm] = useState("");
  const [collecting, setCollecting] = useState<Payment | null>(null);

  const {
    data: payments,
    isLoading,
    error,
    mutate,
  } = useSWR(
    ["/admin/payments", status, term],
    async () =>
      (
        await paymentService.list({
          status: status || undefined,
          q: term || undefined,
          per_page: 100,
        })
      ).items,
    { shouldRetryOnError: false },
  );

  const { data: cod, mutate: refreshCod } = useSWR(
    "/admin/payments/cod-reconciliation",
    async () => paymentService.codReconciliation(),
  );

  async function refresh() {
    await Promise.all([mutate(), refreshCod()]);
  }

  const currency = payments?.[0]?.currency ?? "BDT";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm">
          Cash on delivery is unpaid until a rider hands in the money — an order
          can be shipped and still owed for.
        </p>
      </div>

      {cod && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="space-y-1">
            <CardDescription>Out with riders</CardDescription>
            <p className="text-2xl font-bold tabular-nums">
              {formatMoney(cod.totals.outstanding, currency)}
            </p>
            <CardDescription>
              {cod.totals.outstanding_count} order
              {cod.totals.outstanding_count === 1 ? "" : "s"}
            </CardDescription>
          </Card>

          <Card className="space-y-1">
            <CardDescription>Collected (30 days)</CardDescription>
            <p className="text-success text-2xl font-bold tabular-nums">
              {formatMoney(cod.totals.collected, currency)}
            </p>
            <CardDescription>
              {cod.totals.collected_count} order
              {cod.totals.collected_count === 1 ? "" : "s"}
            </CardDescription>
          </Card>

          <Card className="space-y-2">
            <CardTitle className="text-sm">By collector</CardTitle>
            {Object.keys(cod.by_collector).length === 0 ? (
              <CardDescription>Nothing settled yet.</CardDescription>
            ) : (
              <ul className="space-y-1 text-sm">
                {Object.entries(cod.by_collector).map(([name, row]) => (
                  <li key={name} className="flex justify-between">
                    <span className="text-muted-foreground truncate">
                      {name}
                    </span>
                    <span className="tabular-nums">
                      {formatMoney(row.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatus(filter.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              status === filter.value
                ? "bg-accent font-medium"
                : "text-muted-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}

        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Order number or reference"
          aria-label="Search payments"
          className="border-input bg-background ml-auto h-9 w-72 rounded-md border px-3 text-sm"
        />
      </div>

      {error && <FormAlert message={(error as Error).message} />}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Collected by</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    Loading payments&hellip;
                  </td>
                </tr>
              )}

              {!isLoading && payments?.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    No payments match this filter.
                  </td>
                </tr>
              )}

              {payments?.map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="px-4 py-2">
                    {payment.order ? (
                      <Link
                        href={`/admin/orders/${payment.order.number}`}
                        className="font-mono text-xs underline"
                      >
                        {payment.order.number}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone="outline" size="sm">
                      {payment.gateway_label}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <PaymentStatusBadge payment={payment} />
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 text-xs">
                    {payment.collector?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {payment.is_outstanding && payment.gateway === "cod" && (
                      <button
                        onClick={() => setCollecting(payment)}
                        className="text-sm underline"
                      >
                        Record cash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {collecting && (
        <CollectCodDialog
          payment={collecting}
          onClose={() => setCollecting(null)}
          onDone={() => void refresh()}
        />
      )}
    </div>
  );
}
