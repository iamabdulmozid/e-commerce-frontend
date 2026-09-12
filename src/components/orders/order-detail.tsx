"use client";

import { formatMoney } from "@/components/catalog/price";
import {
  OrderStatusChips,
  OrderTimeline,
} from "@/components/orders/order-timeline";
import { Card, CardTitle } from "@/components/ui/card";
import { StoreImage } from "@/components/ui/store-image";
import type { Order } from "@/services/orders";

/**
 * One order, as its customer sees it.
 *
 * The item list and the totals come straight from the order's own snapshot -
 * not from the catalog - so this page renders correctly for a product that has
 * since been renamed, re-priced or deleted entirely.
 */
export function OrderDetail({ order }: { order: Order }) {
  const currency = order.totals.currency;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
      <div className="space-y-6">
        <Card className="p-0">
          <ul className="divide-border divide-y px-5">
            {order.items?.map((item) => (
              <li key={item.sku} className="flex gap-4 py-4">
                <div className="bg-muted/40 size-16 shrink-0 overflow-hidden rounded-lg">
                  <StoreImage
                    src={item.image_url ?? undefined}
                    alt={item.product_name}
                    fallbackLabel={item.product_name}
                    fit="contain"
                    className="size-full p-1"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.variant_label ? `${item.variant_label} · ` : ""}
                    {item.sku}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatMoney(item.unit_price, currency)} × {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-medium tabular-nums">
                  {formatMoney(item.total, currency)}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <CardTitle>Delivery address</CardTitle>
          <address className="text-muted-foreground text-sm not-italic">
            {order.shipping_address.recipient_name}
            <br />
            {order.shipping_address.address_line}
            <br />
            {order.shipping_address.area}, {order.shipping_address.district}
            {order.shipping_address.postal_code
              ? ` ${order.shipping_address.postal_code}`
              : ""}
            <br />
            {order.shipping_address.phone}
          </address>

          {order.customer_note && (
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">Note:</span> {order.customer_note}
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-3">
          <CardTitle>Progress</CardTitle>
          <OrderStatusChips order={order} />
          <div className="pt-2">
            <OrderTimeline order={order} />
          </div>
        </Card>

        <Card className="space-y-2">
          <CardTitle>Total</CardTitle>
          {/* Rendered from the order's stored figures - what checkout
              calculated, never recomputed (engineering rule 5). */}
          <dl className="space-y-1.5 text-sm">
            <Row
              label="Subtotal"
              value={order.totals.subtotal}
              currency={currency}
            />
            {order.totals.discount_total !== "0.00" && (
              <Row
                label="Discount"
                value={order.totals.discount_total}
                currency={currency}
              />
            )}
            {order.totals.tax_total !== "0.00" && (
              <Row
                label="Tax"
                value={order.totals.tax_total}
                currency={currency}
              />
            )}
            <Row
              label="Delivery"
              value={order.totals.shipping_total}
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
