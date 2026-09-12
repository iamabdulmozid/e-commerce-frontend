import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Your bag",
  // A basket is per-shopper and per-moment; there is nothing here for a
  // crawler to index and something to leak if it tried.
  robots: { index: false, follow: false },
};

/**
 * The cart page.
 *
 * A server shell around one client island. The basket itself cannot be
 * server-rendered usefully — it belongs to a guest token in the browser's
 * storage, and its prices and stock have to be live at the moment of viewing
 * rather than at the moment of render.
 */
export default function CartPage() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Your bag</h1>
      <CartView />
    </Container>
  );
}
