"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { formatMoney } from "@/components/catalog/price";
import { OrderStatusChips } from "@/components/orders/order-timeline";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { orderService } from "@/services/orders";

/**
 * The order desk.
 *
 * A QUEUE, not an archive: the default view is the actionable statuses, oldest
 * first, and AGE is emphasised - an order sitting in "confirmed" for three days
 * is the thing this screen exists to surface.
 */
const FILTERS = [
  { value: "", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [term, setTerm] = useState("");

  const { data, isLoading, error } = useSWR(
    ["/admin/orders", status, term],
    async () =>
      (
        await orderService.admin.list({
          status: status || undefined,
          q: term || undefined,
          per_page: 100,
        })
      ).items,
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">
          Oldest first. Order status and payment status move independently — a
          cash-on-delivery order is unpaid until the courier collects.
        </p>
      </div>

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
          placeholder="Order number, email or phone"
          aria-label="Search orders"
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
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 text-right font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    Loading orders&hellip;
                  </td>
                </tr>
              )}

              {!isLoading && data?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    {status || term
                      ? "No orders match this filter."
                      : "No open orders. Everything is dealt with."}
                  </td>
                </tr>
              )}

              {data?.map((order) => (
                <tr key={order.number} className="border-t">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/orders/${order.number}`}
                      className="font-mono text-xs underline"
                    >
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {order.customer?.name ?? order.email}
                  </td>
                  <td className="px-4 py-2">
                    <OrderStatusChips order={order} />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatMoney(
                      order.totals.grand_total,
                      order.totals.currency,
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 text-right text-xs">
                    {ageOf(order.placed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/** How long this has been waiting — the column the queue is really about. */
function ageOf(placedAt: string): string {
  const hours = Math.floor(
    (Date.now() - new Date(placedAt).getTime()) / 3_600_000,
  );

  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}
