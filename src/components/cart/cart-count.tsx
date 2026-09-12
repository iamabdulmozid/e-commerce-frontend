"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart/use-cart";

/**
 * The bag icon and its count.
 *
 * Reads the same SWR key as the cart page, so removing a line there updates
 * this without a second request or either component knowing the other exists.
 *
 * The badge is absent at zero rather than showing "0" — an empty bag is the
 * default state and does not need announcing.
 */
export function CartCount() {
  const { cart } = useCart();
  const count = cart?.summary.items_count ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={
        count === 0
          ? "Your bag is empty"
          : `Your bag, ${count} item${count === 1 ? "" : "s"}`
      }
      className="hover:bg-accent relative flex size-10 items-center justify-center rounded-full transition-colors"
    >
      <ShoppingBag className="size-5" />

      {count > 0 && (
        <span
          aria-hidden
          className="bg-primary text-primary-foreground absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] font-semibold tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
