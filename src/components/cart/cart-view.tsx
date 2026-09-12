"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { refreshCart, useCart } from "@/components/cart/use-cart";
import { formatMoney } from "@/components/catalog/price";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cartService } from "@/services/cart";

/**
 * The basket, its problems, and what it costs.
 *
 * The summary renders exactly what the server sent. It does not add anything
 * up, and it does not show a grand total — shipping is unknown until an
 * address exists, and a figure that changes at checkout reads as a
 * bait-and-switch (Phase 8 rule 20).
 */
export function CartView() {
  const { cart, isLoading } = useCart();
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Browse the shop and add something you like."
        action={<ButtonLink href="/products">Start shopping</ButtonLink>}
        className="mt-8"
      />
    );
  }

  const currency = cart.summary.currency;
  const priceRose = cart.issues.includes("price_changed");
  const shortStock =
    cart.issues.includes("insufficient_stock") ||
    cart.issues.includes("out_of_stock");

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await refreshCart();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <Card className="p-0">
        <ul className="divide-border divide-y px-5">
          {cart.items.map((line) => (
            <CartLineRow key={line.id} line={line} currency={currency} />
          ))}
        </ul>
      </Card>

      <Card className="space-y-4 lg:sticky lg:top-24">
        <h2 className="font-semibold">Summary</h2>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Items ({cart.summary.items_count})
            </dt>
            <dd className="tabular-nums">
              {formatMoney(cart.summary.subtotal, currency)}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            {/* Honest about what is not yet known, rather than guessing. */}
            <dd className="text-muted-foreground">Calculated at checkout</dd>
          </div>
        </dl>

        <div className="border-border flex justify-between border-t pt-3 font-semibold">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatMoney(cart.summary.subtotal, currency)}
          </span>
        </div>

        {/* One control per blocking problem, so the shopper can clear it. */}
        {priceRose && (
          <div className="bg-muted space-y-2 rounded-lg p-3 text-sm">
            <p>Some prices have changed since you added them.</p>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void run(() => cartService.acknowledgePrices())}
            >
              Accept new prices
            </Button>
          </div>
        )}

        {shortStock && (
          <div className="bg-warning-soft text-warning-foreground space-y-2 rounded-lg p-3 text-sm">
            <p>Some items are no longer available in the quantity you chose.</p>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void run(() => cartService.clamp())}
            >
              Reduce to what is available
            </Button>
          </div>
        )}

        {/*
          Live from Phase 9. `checkout_ready` is computed server-side and is the
          single field checkout itself gates on, so a bag the button lets
          through is a bag the API will accept.
        */}
        {cart.checkout_ready ? (
          <ButtonLink href="/checkout" size="lg" className="w-full">
            Checkout
          </ButtonLink>
        ) : (
          // A real <button disabled>, not a link with aria-disabled: an
          // aria-disabled anchor still navigates on click and on Enter, so it
          // would take a shopper to a checkout that refuses them.
          <Button size="lg" className="w-full" disabled>
            Checkout
          </Button>
        )}

        {/* The reason sits under the button, not in a tooltip: a disabled
            control with no visible explanation is a dead end. */}
        <p className="text-muted-foreground text-center text-xs">
          {!cart.checkout_ready
            ? priceRose
              ? "Accept the new prices to continue."
              : shortStock
                ? "Adjust the quantities above to continue."
                : "Resolve the problems above to continue."
            : "You will pay cash on delivery."}
        </p>
      </Card>
    </div>
  );
}
