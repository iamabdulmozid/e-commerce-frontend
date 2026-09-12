"use client";

import Link from "next/link";
import { use, useState } from "react";
import useSWR from "swr";
import { formatMoney } from "@/components/catalog/price";
import { OrderStatusChips } from "@/components/orders/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { orderService, type OrderStatus } from "@/services/orders";

/**
 * One order, for staff.
 *
 * The status control is populated from `GET /orders/{n}/transitions`, so the UI
 * can only ever offer moves the state machine allows. Embedding a copy of the
 * transition table here would drift from the server's the first time a phase
 * touched it — and then offer buttons that 409.
 */
export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = use(params);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const {
    data: order,
    isLoading,
    mutate,
  } = useSWR(
    `/admin/orders/${number}`,
    async () => orderService.admin.show(number),
    { shouldRetryOnError: false },
  );

  const { data: transitions, mutate: refreshTransitions } = useSWR(
    `/admin/orders/${number}/transitions`,
    async () => orderService.admin.transitions(number),
  );

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!order) return <Card>Order not found.</Card>;

  const currency = order.totals.currency;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);

    try {
      await action();
      await Promise.all([mutate(), refreshTransitions()]);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError("status") ?? caught.displayMessage)
          : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="text-muted-foreground text-sm underline"
          >
            ← All orders
          </Link>
          <h1 className="font-mono text-xl font-bold">{order.number}</h1>
          <p className="text-muted-foreground text-sm">
            {order.customer?.name ?? "Guest"} · {order.email}
            {order.phone ? ` · ${order.phone}` : ""}
          </p>
        </div>

        <OrderStatusChips order={order} />
      </div>

      {error && <FormAlert message={error} />}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-5">
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 font-medium">SKU</th>
                    <th className="px-4 py-2 text-right font-medium">Price</th>
                    <th className="px-4 py-2 text-right font-medium">Qty</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.sku} className="border-t">
                      <td className="px-4 py-2">
                        {item.product_name}
                        {item.variant_label && (
                          <span className="text-muted-foreground block text-xs">
                            {item.variant_label}
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                        {item.sku}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatMoney(item.unit_price, currency)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums">
                        {formatMoney(item.total, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="space-y-3">
            <CardTitle>History</CardTitle>
            <ul className="space-y-2 text-sm">
              {order.history?.map((row, index) => (
                <li key={index} className="flex flex-wrap gap-2">
                  <span className="text-muted-foreground w-40 shrink-0 text-xs">
                    {new Date(row.at).toLocaleString()}
                  </span>
                  <span className="font-medium">{row.to_label}</span>
                  <span className="text-muted-foreground text-xs">
                    by {row.actor ?? row.actor_type}
                    {row.note ? ` — ${row.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-3">
            <CardTitle>Move this order</CardTitle>

            {transitions && transitions.allowed.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This order has reached the end of its lifecycle.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {transitions?.allowed
                .filter((option) => option.value !== "cancelled")
                .map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        orderService.admin.updateStatus(
                          number,
                          option.value as OrderStatus,
                        ),
                      )
                    }
                  >
                    {option.label}
                  </Button>
                ))}
            </div>

            {transitions?.allowed.some((o) => o.value === "cancelled") && (
              <div className="border-border space-y-2 border-t pt-3">
                {!cancelling ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCancelling(true)}
                  >
                    Cancel order
                  </Button>
                ) : (
                  <>
                    {/* The stock consequence, in plain words, BEFORE the
                        decision — "-12" is read very differently at the end of
                        a shift. */}
                    <p className="text-muted-foreground text-xs">
                      {order.stock_consumed_at
                        ? "Stock was already taken for this order and will be returned to the shelf."
                        : "The stock held for this order will be released."}
                    </p>
                    <input
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Reason (required)"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy || cancelReason.trim() === ""}
                        onClick={() =>
                          void run(async () => {
                            await orderService.admin.cancel(
                              number,
                              cancelReason,
                            );
                            setCancelling(false);
                            setCancelReason("");
                          })
                        }
                      >
                        Confirm cancellation
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCancelling(false)}
                      >
                        Back
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          <Card className="space-y-2">
            <CardTitle>Totals</CardTitle>
            <dl className="space-y-1.5 text-sm">
              <Row
                label="Subtotal"
                value={order.totals.subtotal}
                currency={currency}
              />
              <Row
                label="Delivery"
                value={order.totals.shipping_total}
                currency={currency}
              />
              <Row
                label="Tax"
                value={order.totals.tax_total}
                currency={currency}
              />
            </dl>
            <div className="border-border flex justify-between border-t pt-2 font-semibold">
              <span>Grand total</span>
              <span className="tabular-nums">
                {formatMoney(order.totals.grand_total, currency)}
              </span>
            </div>
          </Card>

          <Card className="space-y-2">
            <CardTitle>Internal note</CardTitle>
            <p className="text-muted-foreground text-xs">
              Staff only — never shown to the customer.
            </p>
            <textarea
              value={note || (order.staff_note ?? "")}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="border-input bg-background w-full rounded-md border p-2 text-sm"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || note.trim() === ""}
              onClick={() =>
                void run(() => orderService.admin.addNote(number, note))
              }
            >
              Save note
            </Button>
          </Card>

          <Card className="space-y-2">
            <CardTitle>Delivery address</CardTitle>
            <address className="text-muted-foreground text-sm not-italic">
              {order.shipping_address.recipient_name}
              <br />
              {order.shipping_address.address_line}
              <br />
              {order.shipping_address.area}, {order.shipping_address.district}
              <br />
              {order.shipping_address.phone}
            </address>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  currency,
}: {
  label: string;
  value: string;
  currency: string;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{formatMoney(value, currency)}</dd>
    </div>
  );
}
