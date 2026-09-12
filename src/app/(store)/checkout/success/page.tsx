import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

/**
 * The order number, and what happens next.
 *
 * For a guest this is the ONLY place the number appears, so it is large,
 * selectable and accompanied by the tracking link they will need. (Phase 23
 * will also email it; until then this page is the record, and saying so is
 * more honest than implying an email that is not sent.)
 *
 * The number comes from the query string because the order itself belongs to a
 * guest token that has just been consumed - fetching it here would 404.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <Container className="py-12 sm:py-16">
      <Card className="mx-auto max-w-lg space-y-5 text-center">
        <span className="bg-success-soft text-success mx-auto flex size-14 items-center justify-center rounded-full">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>

        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold">Thank you</h1>
          <p className="text-muted-foreground text-sm">
            Your order is placed and the shop has been notified.
          </p>
        </div>

        {order && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-xs uppercase">
              Your order number
            </p>
            <p className="font-mono text-lg font-semibold select-all">
              {order}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Keep this — you will need it, with your email, to track the order.
            </p>
          </div>
        )}

        <div className="text-muted-foreground space-y-1 text-sm">
          <p>You will pay the courier in cash when your order arrives.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="/orders/track">Track this order</ButtonLink>
          <ButtonLink href="/products" variant="outline">
            Keep shopping
          </ButtonLink>
        </div>
      </Card>
    </Container>
  );
}
