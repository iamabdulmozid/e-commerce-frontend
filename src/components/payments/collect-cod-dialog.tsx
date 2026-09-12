"use client";

import { useState } from "react";
import { formatMoney } from "@/components/catalog/price";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { paymentService, type Payment } from "@/services/payments";

/**
 * Record cash handed in by a rider.
 *
 * The amount is PRE-FILLED with the exact payment amount and the field explains
 * why a different figure will be refused: the API requires an exact match,
 * because recording 800 against a 960 payment leaves a payment that is neither
 * paid nor unpaid. Letting someone type a short amount and then rejecting it
 * would be a worse version of the same rule.
 *
 * The alternative - "not collected" - is right beside it, because a failed
 * delivery is the other half of this conversation and burying it sends people
 * to record a wrong amount instead.
 */
export function CollectCodDialog({
  payment,
  onClose,
  onDone,
}: {
  payment: Payment;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(payment.amount);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [failing, setFailing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);

    try {
      await action();
      onDone();
      onClose();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError("amount") ?? caught.displayMessage)
          : "Could not record that.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-foreground/40 fixed inset-0 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <div>
          <CardTitle>
            {failing ? "Mark as not collected" : "Record cash collection"}
          </CardTitle>
          <CardDescription>
            Order {payment.order?.number} ·{" "}
            {formatMoney(payment.amount, payment.currency)} due
          </CardDescription>
        </div>

        {failing ? (
          <Field
            label="What happened?"
            name="reason"
            required
            hint="The order itself is not changed — decide that separately."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        ) : (
          <>
            <Field
              label="Amount collected"
              name="amount"
              required
              hint="Must match the amount due exactly. A short collection is a dispute, not a payment."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Field
              label="Note"
              name="note"
              hint="Optional — rider name, receipt number."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}

        {error && <FormAlert message={error} />}

        <div className="flex flex-wrap gap-2">
          {failing ? (
            <Button
              variant="destructive"
              disabled={busy || reason.trim() === ""}
              onClick={() =>
                void run(() => paymentService.markFailed(payment.id, reason))
              }
            >
              {busy ? "Saving…" : "Mark not collected"}
            </Button>
          ) : (
            <Button
              disabled={busy || amount.trim() === ""}
              onClick={() =>
                void run(() =>
                  paymentService.collect(payment.id, amount, note || undefined),
                )
              }
            >
              {busy ? "Saving…" : "Record collection"}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => (failing ? setFailing(false) : onClose())}
          >
            {failing ? "Back" : "Cancel"}
          </Button>

          {!failing && (
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={() => setFailing(true)}
            >
              Not collected
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
