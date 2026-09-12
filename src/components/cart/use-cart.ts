"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { cartService, type Cart } from "@/services/cart";

/**
 * One SWR key for the whole app.
 *
 * The header badge and the cart page both read it, so a line removed on the
 * cart page updates the badge without either component knowing the other
 * exists — and without a second request.
 */
export const CART_KEY = "cart";

export function useCart() {
  const { data, error, isLoading, mutate } = useSWR<Cart>(
    CART_KEY,
    () => cartService.get(),
    {
      // A cart is cheap to fetch and expensive to get wrong: a shopper
      // returning to a tab after ten minutes should see live prices and live
      // stock, not what was true when they left.
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );

  return { cart: data, error, isLoading, mutate };
}

/** Refresh the cart everywhere after a mutation made elsewhere. */
export function refreshCart(next?: Cart): Promise<Cart | undefined> {
  return globalMutate<Cart>(CART_KEY, next, { revalidate: next === undefined });
}
