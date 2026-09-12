import type { Metadata } from "next";
import { OrderLookup } from "@/components/orders/order-lookup";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false, follow: false },
};

/**
 * Guest order lookup.
 *
 * Needs the number AND the email it was placed with: a sequential order number
 * alone is guessable, and the pair is not (Phase 10 rule 29).
 */
export default function TrackOrderPage() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold sm:text-3xl">Track your order</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter the order number from your confirmation, along with the email
          you used.
        </p>
        <OrderLookup />
      </div>
    </Container>
  );
}
