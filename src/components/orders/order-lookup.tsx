"use client";

import { useState } from "react";
import { OrderDetail } from "@/components/orders/order-detail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { orderService, type Order } from "@/services/orders";

export function OrderLookup() {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      setOrder(await orderService.lookup(number.trim(), email.trim()));
    } catch (caught) {
      // One message whatever went wrong, matching the API: a different response
      // for "wrong email" would let someone test whether a number exists.
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not find that order.",
      );
      setOrder(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {!order && (
        <Card>
          <form onSubmit={submit} className="space-y-3">
            <Field
              label="Order number"
              name="number"
              required
              placeholder="ORD-2026-000042"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error && <FormAlert message={error} />}

            <Button type="submit" disabled={busy || !number || !email}>
              {busy ? "Looking…" : "Find my order"}
            </Button>
          </form>
        </Card>
      )}

      {order && (
        <>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm font-semibold">{order.number}</p>
            <button
              type="button"
              onClick={() => setOrder(null)}
              className="text-sm underline"
            >
              Look up another
            </button>
          </div>
          <OrderDetail order={order} />
        </>
      )}
    </div>
  );
}
