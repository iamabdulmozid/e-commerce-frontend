import { refreshCart } from "@/components/cart/use-cart";
import { cartService, readCartToken } from "@/services/cart";

/**
 * Hand the guest basket to the account that just signed in.
 *
 * Called from the login and register flows rather than from AuthProvider, so
 * the cart module stays something auth does not have to know about.
 *
 * Never throws. A merge that fails must not block a login: the shopper is
 * signed in either way, and the worst case is a basket they have to rebuild —
 * far better than an authentication that appears to have failed. The guest
 * token is deliberately left in place on failure so a later request can still
 * pick it up.
 */
export async function mergeGuestCartOnLogin(): Promise<void> {
  if (readCartToken() === null) {
    // Nothing to hand over. Still refresh, because the customer may have a
    // saved basket from another device that should appear in the header.
    await refreshCart();
    return;
  }

  try {
    const result = await cartService.merge();

    await refreshCart(result ?? undefined);
  } catch {
    await refreshCart();
  }
}
