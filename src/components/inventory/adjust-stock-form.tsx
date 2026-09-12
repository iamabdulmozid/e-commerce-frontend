"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { VariantPicker } from "@/components/inventory/variant-picker";
import { ApiError } from "@/lib/api";
import { inventoryService, type AdjustmentReason } from "@/services/inventory";

/**
 * Correct a stock figure, with a reason.
 *
 * The form tells the user BEFORE they submit whether their delta will need
 * approval. Discovering that after the fact — "submitted for approval" when
 * you expected the number to change — is the kind of surprise that makes
 * people stop trusting a screen.
 */
export function AdjustStockForm({ onDone }: { onDone: () => void }) {
  const [variantId, setVariantId] = useState<number | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("recount");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const { data: options } = useSWR("/admin/inventory/options", async () =>
    inventoryService.options(),
  );

  const threshold = options?.approval_threshold ?? 50;
  const needsApproval = delta !== "" && Math.abs(Number(delta)) > threshold;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (variantId === null) {
      setError("Choose which variant to adjust.");
      return;
    }

    setBusy(true);
    setError(null);
    setDone(null);

    try {
      const adjustment = await inventoryService.adjust({
        variant_id: variantId,
        delta: Number(delta),
        reason,
        note: note || undefined,
      });

      setDone(
        adjustment.status === "pending"
          ? "Submitted for approval — stock has not changed yet."
          : "Adjustment applied.",
      );
      setDelta("");
      setNote("");
      onDone();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError("delta") ??
              caught.fieldError("reason") ??
              caught.message)
          : "Could not record the adjustment.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>Adjust stock</CardTitle>
        <CardDescription>
          Use a negative number to remove stock. Adjustments over {threshold}{" "}
          units need approval.
        </CardDescription>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <VariantPicker value={variantId} onChange={setVariantId} />

        <Field
          label="Change"
          name="adjust-delta"
          type="number"
          required
          hint="e.g. -3 to write off three units"
          value={delta}
          onChange={(event) => setDelta(event.target.value)}
        />

        <div className="space-y-1.5">
          <label htmlFor="adjust-reason" className="text-sm font-medium">
            Reason
          </label>
          <select
            id="adjust-reason"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value as AdjustmentReason)
            }
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            {options?.reasons.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Note"
          name="adjust-note"
          hint="Optional detail — the reason above is what gets reported on."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {needsApproval && (
          <p className="text-warning-foreground bg-warning-soft rounded-md px-3 py-2 text-sm">
            This is over {threshold} units, so it will be sent for approval
            rather than applied now.
          </p>
        )}

        {error && <FormAlert message={error} />}
        {done && <p className="text-success text-sm">{done}</p>}

        <Button type="submit" variant="secondary" disabled={busy || !delta}>
          {busy
            ? "Recording…"
            : needsApproval
              ? "Submit for approval"
              : "Apply"}
        </Button>
      </form>
    </Card>
  );
}
