import { Badge } from "@/components/ui/badge";
import type { Payment, PaymentState } from "@/services/payments";

/**
 * A payment's own status, separate from the order's.
 *
 * `pending` is warning-toned rather than neutral on purpose: for a COD store
 * that colour is money still out with a rider, which is the figure the whole
 * reconciliation screen exists to surface.
 */
const TONE: Record<PaymentState, "success" | "warning" | "neutral"> = {
  initiated: "warning",
  pending: "warning",
  success: "success",
  failed: "neutral",
  cancelled: "neutral",
  expired: "neutral",
  refunded: "neutral",
  partially_refunded: "warning",
};

export function PaymentStatusBadge({ payment }: { payment: Payment }) {
  return (
    <Badge tone={TONE[payment.status]} size="sm">
      {payment.status_label}
    </Badge>
  );
}
