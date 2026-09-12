"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { VariantPicker } from "@/components/inventory/variant-picker";
import { ApiError } from "@/lib/api";
import { inventoryService } from "@/services/inventory";

/**
 * Stock arrived.
 *
 * Three fields and no approval step, which is the whole design (Phase 7
 * rule 29): a store that needs a signature to put delivered goods on the shelf
 * stops using the feature, and once staff work around the ledger the ledger
 * starts lying.
 */
export function ReceiveStockForm({ onDone }: { onDone: () => void }) {
  const [variantId, setVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (variantId === null) {
      setError("Choose which variant arrived.");
      return;
    }

    setBusy(true);
    setError(null);
    setDone(null);

    try {
      const transaction = await inventoryService.receive({
        variant_id: variantId,
        quantity: Number(quantity),
        note: note || undefined,
      });

      setDone(`Received. On hand is now ${transaction.balance_after}.`);
      setQuantity("");
      setNote("");
      onDone();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError("quantity") ?? caught.message)
          : "Could not record the receipt.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <CardTitle>Receive stock</CardTitle>
        <CardDescription>
          Records a PURCHASE movement. Applies immediately.
        </CardDescription>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <VariantPicker value={variantId} onChange={setVariantId} />

        <Field
          label="Quantity"
          name="receive-quantity"
          type="number"
          min={1}
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />

        <Field
          label="Note"
          name="receive-note"
          hint="Optional — a delivery reference helps later."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {error && <FormAlert message={error} />}
        {done && <p className="text-success text-sm">{done}</p>}

        <Button type="submit" disabled={busy || !quantity}>
          {busy ? "Recording…" : "Receive"}
        </Button>
      </form>
    </Card>
  );
}
