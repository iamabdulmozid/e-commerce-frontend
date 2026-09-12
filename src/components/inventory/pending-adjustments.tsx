"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { inventoryService, type StockAdjustment } from "@/services/inventory";

/**
 * The approval queue.
 *
 * Shown only to holders of inventory.adjust.approve, and hidden entirely when
 * empty — a permanent empty panel above the table would push the actual work
 * down the page every day to warn about something that happens rarely.
 *
 * Each row states the stock consequence in plain words before the approver
 * commits to it, because "-500" and "this will remove 500 units" are read very
 * differently at the end of a shift.
 */
export function PendingAdjustments({ onDecided }: { onDecided: () => void }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, mutate } = useSWR(
    "/admin/inventory/adjustments?pending",
    async () =>
      (await inventoryService.adjustments({ status: "pending", per_page: 50 }))
        .items,
  );

  const pending = data ?? [];

  if (pending.length === 0) return null;

  async function decide(
    adjustment: StockAdjustment,
    decision: "approve" | "reject",
  ) {
    setBusyId(adjustment.id);
    setError(null);

    try {
      if (decision === "approve") {
        await inventoryService.approveAdjustment(adjustment.id);
      } else {
        // Required by the API: a refusal with no reason leaves the requester
        // with nothing to act on.
        const reason = window.prompt("Why are you rejecting this adjustment?");
        if (!reason) return;

        await inventoryService.rejectAdjustment(adjustment.id, reason);
      }

      await mutate();
      onDecided();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError("status") ?? caught.message)
          : "Could not record the decision.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="border-warning/40 space-y-3">
      <div>
        <CardTitle>
          {pending.length} adjustment{pending.length === 1 ? "" : "s"} awaiting
          approval
        </CardTitle>
        <CardDescription>
          Stock has not changed for any of these yet.
        </CardDescription>
      </div>

      {error && <FormAlert message={error} />}

      <ul className="divide-y">
        {pending.map((adjustment) => (
          <li
            key={adjustment.id}
            className="flex flex-wrap items-center gap-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {adjustment.variant?.sku ?? `Variant ${adjustment.variant_id}`}
                {" — "}
                {adjustment.delta < 0
                  ? `remove ${Math.abs(adjustment.delta)} units`
                  : `add ${adjustment.delta} units`}
              </p>
              <p className="text-muted-foreground text-xs">
                {adjustment.reason_label}
                {adjustment.note ? ` · ${adjustment.note}` : ""} · requested by{" "}
                {adjustment.requested_by?.name ?? "unknown"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === adjustment.id}
                onClick={() => void decide(adjustment, "approve")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === adjustment.id}
                onClick={() => void decide(adjustment, "reject")}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
