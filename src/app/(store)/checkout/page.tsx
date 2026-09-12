import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Checkout",
  // Per-shopper and per-moment; nothing here for a crawler and something to
  // leak if it tried.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
      <CheckoutForm />
    </Container>
  );
}
