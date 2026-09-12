"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { refreshCart } from "@/components/cart/use-cart";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { cartService } from "@/services/cart";
import type { StockStatus } from "@/services/inventory";

/**
 * The buy control.
 *
 * Disabled rather than hidden when a variant is out of stock, with the reason
 * stated next to it — a shopper who finds the button missing assumes the page
 * is broken; one who finds it disabled and labelled learns something.
 *
 * There is no optimistic update here on purpose. Adding to a cart can fail for
 * reasons the browser cannot predict (the last unit just went, the product was
 * unpublished a second ago), and showing "Added" before the server agrees is
 * how a shopper ends up at a checkout that refuses them.
 */
export function AddToCart({
  variantId,
  stockStatus,
  disabled = false,
}: {
  variantId: number | null;
  stockStatus?: StockStatus;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outOfStock = stockStatus === "out_of_stock";
  const blocked = disabled || outOfStock || variantId === null;

  async function add() {
    if (variantId === null) return;

    setBusy(true);
    setError(null);

    try {
      const cart = await cartService.addItem(variantId, 1);

      // Hand SWR the cart the server just returned rather than triggering a
      // refetch: the response is already authoritative.
      await refreshCart(cart);

      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.fieldError("variant_id") ?? caught.displayMessage)
          : "Could not add this to your bag.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        disabled={blocked || busy}
        onClick={() => void add()}
        className="w-full sm:w-auto"
      >
        {added ? <Check /> : <ShoppingBag />}
        {added ? "Added to bag" : busy ? "Adding…" : "Add to bag"}
      </Button>

      {outOfStock && (
        <p className="text-muted-foreground text-sm">
          This option is out of stock right now.
        </p>
      )}

      {variantId === null && !outOfStock && (
        <p className="text-muted-foreground text-sm">
          Choose an option to continue.
        </p>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
