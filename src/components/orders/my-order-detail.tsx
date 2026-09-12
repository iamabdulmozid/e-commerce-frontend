"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { OrderDetail } from "@/components/orders/order-detail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { orderService } from "@/services/orders";

export function MyOrderDetail({ number }: { number: string }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: order,
    isLoading,
    mutate,
  } = useSWR(`/orders/${number}`, async () => orderService.show(number), {
    shouldRetryOnError: false,
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (!order) {
    return (
      <Card className="space-y-3 text-center">
        <p>We could not find that order.</p>
        <Link href="/account/orders" className="text-sm underline">
          Back to your orders
        </Link>
      </Card>
    );
  }

  async function cancel() {
    setBusy(true);
    setError(null);

    try {
      await mutate(await orderService.cancel(number, reason), {
        revalidate: false,
      });
      setCancelling(false);
      setReason("");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError("status") ?? caught.displayMessage)
          : "Could not cancel this order.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/account/orders"
            className="text-muted-foreground text-sm underline"
          >
            ← All orders
          </Link>
          <h1 className="font-mono text-xl font-bold">{order.number}</h1>
        </div>

        {/* Shown only when the server says so. `can_cancel` follows the state
            machine's actor column, so the button cannot appear for an order
            the API would refuse to cancel. */}
        {order.can_cancel && !cancelling && (
          <Button variant="outline" onClick={() => setCancelling(true)}>
            Cancel order
          </Button>
        )}
      </div>

      {cancelling && (
        <Card className="space-y-3">
          <p className="text-sm font-medium">
            Why are you cancelling this order?
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Changed my mind, ordered by mistake…"
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          />

          {error && <FormAlert message={error} />}

          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={busy || reason.trim().length === 0}
              onClick={() => void cancel()}
            >
              {busy ? "Cancelling…" : "Cancel this order"}
            </Button>
            <Button variant="ghost" onClick={() => setCancelling(false)}>
              Keep it
            </Button>
          </div>
        </Card>
      )}

      <OrderDetail order={order} />
    </div>
  );
}
