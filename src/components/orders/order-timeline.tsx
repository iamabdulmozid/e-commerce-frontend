import { Badge } from "@/components/ui/badge";
import type { Order, OrderPaymentStatus, OrderStatus } from "@/services/orders";

/**
 * Where the order has got to.
 *
 * Renders the server's `timeline` - the customer-safe projection - rather than
 * deriving stages from the status. The server decides what a shopper sees, and
 * a client that inferred stages would start showing internal states the day one
 * was added.
 */
export function OrderTimeline({ order }: { order: Order }) {
  const timeline = order.timeline ?? [];

  if (timeline.length === 0) return null;

  return (
    <ol className="space-y-0">
      {timeline.map((step, index) => {
        const last = index === timeline.length - 1;

        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={
                  last
                    ? "bg-primary size-3 rounded-full ring-4 ring-[var(--primary-soft)]"
                    : "bg-success size-3 rounded-full"
                }
              />
              {!last && <span className="bg-border w-px flex-1" />}
            </div>

            <div className={last ? "pb-0" : "pb-6"}>
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(step.at).toLocaleString()}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const STATUS_TONE: Partial<
  Record<OrderStatus, "success" | "warning" | "neutral" | "primary">
> = {
  pending: "warning",
  confirmed: "primary",
  processing: "primary",
  packed: "primary",
  shipped: "primary",
  delivered: "success",
  cancelled: "neutral",
  refunded: "neutral",
};

const PAYMENT_TONE: Partial<
  Record<OrderPaymentStatus, "success" | "warning" | "neutral">
> = {
  pending: "warning",
  paid: "success",
  failed: "neutral",
  refund_due: "warning",
  refunded: "neutral",
};

/**
 * Two chips, never one.
 *
 * Order status and payment status are independent axes: a COD order that is
 * `shipped` and still `pending` payment is the normal case, and collapsing them
 * into a single badge would show a contradiction that is not one.
 */
export function OrderStatusChips({ order }: { order: Order }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={STATUS_TONE[order.status] ?? "neutral"} size="sm">
        {order.status_label}
      </Badge>
      <Badge tone={PAYMENT_TONE[order.payment_status] ?? "neutral"} size="sm">
        {order.payment_status_label}
      </Badge>
    </div>
  );
}
