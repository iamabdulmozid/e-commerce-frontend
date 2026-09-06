"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * Errors inside the shop keep the shop around them - header, navigation,
 * footer - so a failed fetch on one page does not strand the shopper.
 */
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <span className="bg-warning-soft text-warning-foreground mb-6 flex size-16 items-center justify-center rounded-2xl">
        <AlertTriangle className="size-8" aria-hidden />
      </span>

      <h1 className="text-2xl font-bold lg:text-3xl">
        This page didn&apos;t load
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        {error.message || "We hit an unexpected problem. Please try again."}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
        <ButtonLink href="/products" variant="outline">
          Browse products
        </ButtonLink>
      </div>
    </Container>
  );
}
