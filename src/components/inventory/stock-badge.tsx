import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/services/inventory";

/**
 * The stock signal, in words.
 *
 * Tone carries the meaning as well as colour: "Out of stock" and "Low stock"
 * read differently in text, so a customer who cannot distinguish the two hues
 * still gets the message.
 *
 * Deliberately shows no number even where the caller has one. The public
 * payload does not carry a count (Phase 7 rule 19), and a badge that could
 * display one would eventually be reused on a page where that leaks.
 */

const LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Only a few left",
  out_of_stock: "Out of stock",
};

const TONES: Record<StockStatus, "success" | "warning" | "neutral"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "neutral",
};

export function StockBadge({
  status,
  untracked = false,
  backorder = false,
  size = "sm",
}: {
  status: StockStatus;
  /** Admin-only context: this variant is not stock-tracked at all. */
  untracked?: boolean;
  backorder?: boolean;
  size?: "sm" | "md";
}) {
  if (untracked) {
    return (
      <Badge tone="outline" size={size}>
        Not tracked
      </Badge>
    );
  }

  if (backorder) {
    return (
      <Badge tone="primary" size={size}>
        Backorder
      </Badge>
    );
  }

  return (
    <Badge tone={TONES[status]} size={size}>
      {LABELS[status]}
    </Badge>
  );
}
