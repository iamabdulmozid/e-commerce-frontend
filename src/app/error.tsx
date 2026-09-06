"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * The app-wide error boundary.
 *
 * `error.message` is shown, but only because this project's API returns
 * envelope messages written for humans. Anything that is not one of those -
 * a genuine exception - arrives here already redacted by Next in production,
 * which is the behaviour we want: a shopper should never read a stack trace.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center py-16 text-center">
      <span className="bg-warning-soft text-warning-foreground mb-6 flex size-16 items-center justify-center rounded-2xl">
        <AlertTriangle className="size-8" aria-hidden />
      </span>

      <h1 className="text-3xl font-bold lg:text-4xl">Something went wrong</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        {error.message || "We hit an unexpected problem loading this page."}
      </p>

      {error.digest && (
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Reference {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
        <ButtonLink href="/" variant="outline">
          <Home />
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
