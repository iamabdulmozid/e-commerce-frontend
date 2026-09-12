"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Countdown } from "@/components/store/countdown";

/**
 * The countdown, wired to reload the page when it runs out.
 *
 * The flash sale is server-rendered and cached, so once the deadline passes
 * the markup on screen is stale — it shows sale prices for an offer that has
 * ended, which is the one failure mode a countdown must not have. A shopper
 * who left the tab open overnight would otherwise click through to a product
 * page quoting a different, higher price than the card they clicked.
 *
 * `router.refresh()` re-runs the Server Components and swaps in whatever is
 * true now: the next sale, or nothing at all. It preserves scroll position and
 * client state, so it is not a page reload from the shopper's point of view.
 *
 * Split out from Countdown so the countdown itself stays a dumb clock that a
 * detail page or an email preview can render without dragging the router in.
 */
export function SaleCountdown({
  endsAt,
  tone = "band",
  className,
}: {
  endsAt: string;
  tone?: "band" | "page";
  className?: string;
}) {
  const router = useRouter();

  // Stable identity, so the effect that watches it in Countdown does not fire
  // again on every parent render.
  const refresh = useCallback(() => router.refresh(), [router]);

  return (
    <Countdown
      endsAt={endsAt}
      onExpire={refresh}
      tone={tone}
      className={className}
    />
  );
}
