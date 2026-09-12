"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/components/catalog/price";
import { refreshCart } from "@/components/cart/use-cart";
import { StoreImage } from "@/components/ui/store-image";
import { cartService, type CartLine } from "@/services/cart";
import { cn } from "@/lib/utils";

/**
 * One basket line, with its problems shown on it.
 *
 * Issues render HERE rather than as a page banner (Phase 8 rule 15's
 * reasoning): a shopper with eight lines and one stock problem needs to know
 * which one, and "something in your cart is unavailable" is the version of
 * this that generates support tickets.
 */
export function CartLineRow({
  line,
  currency,
}: {
  line: CartLine;
  currency: string;
}) {
  const [busy, setBusy] = useState(false);

  const product = line.variant?.product;
  const shortage = line.issues.find(
    (issue) =>
      issue.code === "insufficient_stock" || issue.code === "out_of_stock",
  );
  const priceChange = line.issues.find(
    (issue) => issue.code === "price_changed",
  );
  const unavailable = line.issues.some((issue) => issue.code === "unavailable");

  async function setQuantity(quantity: number) {
    setBusy(true);
    try {
      await refreshCart(await cartService.updateItem(line.id, quantity));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await refreshCart(await cartService.removeItem(line.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className={cn(
        "flex gap-4 py-5",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <div className="bg-muted/40 size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
        <StoreImage
          src={product?.image ?? undefined}
          alt={product?.name ?? "Product"}
          fallbackLabel={product?.name ?? ""}
          fit="contain"
          className="size-full p-1"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product ? (
              <Link
                href={`/products/${product.slug}`}
                className="hover:text-primary line-clamp-2-safe text-sm font-medium"
              >
                {product.name}
              </Link>
            ) : (
              <span className="text-sm font-medium">Item</span>
            )}

            {line.variant?.label && (
              <p className="text-muted-foreground text-xs">
                {line.variant.label}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(line.line_total, currency)}
            </p>
            {line.quantity > 1 && (
              <p className="text-muted-foreground text-xs tabular-nums">
                {formatMoney(line.unit_price, currency)} each
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
          <div className="border-border inline-flex items-center rounded-lg border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => void setQuantity(line.quantity - 1)}
              className="hover:bg-accent flex size-8 items-center justify-center rounded-l-lg"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => void setQuantity(line.quantity + 1)}
              className="hover:bg-accent flex size-8 items-center justify-center rounded-r-lg"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void remove()}
            className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        </div>

        {/* One control per problem, offering the fix rather than describing it. */}
        {shortage && (
          <p className="text-warning-foreground bg-warning-soft mt-1 rounded-md px-2.5 py-1.5 text-xs">
            {shortage.available && shortage.available > 0 ? (
              <>
                Only {shortage.available} left.{" "}
                <button
                  type="button"
                  onClick={() => void setQuantity(shortage.available as number)}
                  className="font-medium underline"
                >
                  Reduce to {shortage.available}
                </button>
              </>
            ) : (
              "This item has sold out."
            )}
          </p>
        )}

        {priceChange && (
          <p className="text-muted-foreground bg-muted mt-1 rounded-md px-2.5 py-1.5 text-xs">
            Price changed from {formatMoney(priceChange.was ?? "0", currency)}{" "}
            to {formatMoney(priceChange.now ?? "0", currency)}.
          </p>
        )}

        {unavailable && (
          <p className="text-destructive bg-destructive/10 mt-1 rounded-md px-2.5 py-1.5 text-xs">
            This item is no longer sold. Remove it to continue.
          </p>
        )}
      </div>
    </li>
  );
}
