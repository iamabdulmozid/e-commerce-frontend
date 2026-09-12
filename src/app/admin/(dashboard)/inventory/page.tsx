"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { StockBadge } from "@/components/inventory/stock-badge";
import { ReceiveStockForm } from "@/components/inventory/receive-stock-form";
import { AdjustStockForm } from "@/components/inventory/adjust-stock-form";
import { VariantLedger } from "@/components/inventory/variant-ledger";
import { PendingAdjustments } from "@/components/inventory/pending-adjustments";
import { cn } from "@/lib/utils";
import { can } from "@/types/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { inventoryService, type StockStatus } from "@/services/inventory";

/**
 * Stock levels across the catalog.
 *
 * Shaped as a worklist rather than a document: the default sort puts the
 * lowest availability first, because the rows that need attention are the
 * reason anyone opens this page. A merchant browsing their whole catalog is
 * already served by Products.
 */

const FILTERS: { value: StockStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "in_stock", label: "In stock" },
];

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<StockStatus | "">("");
  const [term, setTerm] = useState("");
  const [openVariant, setOpenVariant] = useState<number | null>(null);

  const canAdjust = can(user, "inventory.adjust");
  const canApprove = can(user, "inventory.adjust.approve");

  const { data, isLoading, error, mutate } = useSWR(
    ["/admin/inventory", status, term],
    async () =>
      (
        await inventoryService.levels({
          status,
          q: term || undefined,
          per_page: 100,
        })
      ).items,
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground text-sm">
          Available is what is on hand minus what checkout is currently holding.
          Every change here is recorded in the stock ledger and cannot be edited
          afterwards.
        </p>
      </div>

      {canApprove && <PendingAdjustments onDecided={() => void mutate()} />}

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
          onChange={(event) => setTerm(event.target.value)}
          placeholder="SKU or product name"
          aria-label="Search inventory"
          className="border-input bg-background ml-auto h-9 w-64 rounded-md border px-3 text-sm"
        />
      </div>

      {canAdjust && (
        <div className="grid gap-4 md:grid-cols-2">
          <ReceiveStockForm onDone={() => void mutate()} />
          <AdjustStockForm onDone={() => void mutate()} />
        </div>
      )}

      {error && <FormAlert message={(error as Error).message} />}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 text-right font-medium">On hand</th>
                <th className="px-4 py-2 text-right font-medium">Held</th>
                <th className="px-4 py-2 text-right font-medium">Available</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    Loading stock levels&hellip;
                  </td>
                </tr>
              )}

              {!isLoading && data?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-4 py-8 text-center"
                  >
                    {term || status
                      ? "No variants match this filter."
                      : "No stock yet. Receive stock above to start the ledger."}
                  </td>
                </tr>
              )}

              {data?.map((level) => (
                <tr key={level.variant_id} className="border-t">
                  <td className="px-4 py-2">
                    {level.variant?.product?.name ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                    {level.variant?.sku ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {level.track_inventory ? level.on_hand : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {level.reserved > 0 ? level.reserved : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {level.track_inventory ? level.available : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <StockBadge
                      status={level.status}
                      untracked={!level.track_inventory}
                      backorder={level.backorder_allowed}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() =>
                        setOpenVariant(
                          openVariant === level.variant_id
                            ? null
                            : level.variant_id,
                        )
                      }
                      className="text-sm underline"
                    >
                      {openVariant === level.variant_id ? "Hide" : "History"}
                    </button>
                  </td>
                </tr>
              ))}

              {openVariant !== null && (
                <tr className="bg-muted/30 border-t">
                  <td colSpan={7} className="px-4 py-4">
                    <VariantLedger variantId={openVariant} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
