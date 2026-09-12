"use client";

import useSWR from "swr";
import { inventoryService } from "@/services/inventory";
import { cn } from "@/lib/utils";

/**
 * The movement history for one variant.
 *
 * This is the screen someone opens when a figure is disputed, so it shows the
 * running balance beside every row. A list of +10, -2, -1 with no balance
 * tells you what happened but never whether the shelf is empty — which is the
 * actual question being asked.
 */
export function VariantLedger({ variantId }: { variantId: number }) {
  const { data, isLoading } = useSWR(
    `/admin/inventory/${variantId}`,
    async () => inventoryService.show(variantId),
  );

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">Loading history&hellip;</p>
    );
  }

  const transactions = data?.transactions ?? [];

  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No movements recorded for this variant yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs uppercase">
        Stock ledger — newest first. These rows cannot be edited.
      </p>

      <table className="w-full text-sm">
        <thead className="text-muted-foreground text-left text-xs">
          <tr>
            <th className="py-1 font-medium">When</th>
            <th className="py-1 font-medium">Movement</th>
            <th className="py-1 text-right font-medium">Change</th>
            <th className="py-1 text-right font-medium">On hand after</th>
            <th className="py-1 font-medium">Who</th>
            <th className="py-1 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="text-muted-foreground py-1.5 whitespace-nowrap">
                {row.created_at
                  ? new Date(row.created_at).toLocaleString()
                  : "—"}
              </td>
              <td className="py-1.5">{row.type_label}</td>
              <td
                className={cn(
                  "py-1.5 text-right font-medium tabular-nums",
                  row.quantity < 0 ? "text-destructive" : "text-success",
                )}
              >
                {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {row.balance_after}
              </td>
              <td className="text-muted-foreground py-1.5">
                {row.actor?.name ?? "System"}
              </td>
              <td className="text-muted-foreground py-1.5">
                {row.note ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
