import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { ProductRail } from "@/components/catalog/product-grid";
import { SaleCountdown } from "@/components/store/sale-countdown";
import { Container } from "@/components/ui/container";
import type { FlashSale } from "@/services/catalog";

/**
 * The flash sale band.
 *
 * Loud on purpose, and the only loud thing on the home page. Every other band
 * is a heading over a rail on the page's own ground; this one is a full-bleed
 * panel with a countdown on it, because it is the only section whose content
 * stops being true at a particular moment. If everything shouted, the shouting
 * would carry no information.
 *
 * It is built entirely from the theme's `sale` tokens — amber, the colour this
 * design system already assigns to discount and urgency, rather than the red a
 * flash sale is usually painted. Red belongs to destructive actions here, and
 * a promotion is not a warning. Because the palette is tokens, the band also
 * follows a store that retunes its brand instead of carrying a hardcoded
 * gradient that would slowly stop matching everything around it.
 *
 * The band renders nothing at all when there is no sale — not a heading, not
 * an empty rail, and above all not a countdown. `ends_at` is the server's
 * answer to "is there one?", and a store that is not running a promotion must
 * not have one implied on its front page (PRD 5B rules 9 and 10).
 *
 * A Server Component. The only client code under it is the clock itself.
 */
export function FlashSaleBand({ sale }: { sale: FlashSale }) {
  if (sale.ends_at === null || sale.items.length === 0) return null;

  const unseen = sale.total - sale.items.length;

  return (
    <section
      aria-labelledby="flash-sale-heading"
      /*
       * Deep amber, not the `--sale` chip fill: the product tiles on this band
       * are white, and on a light amber ground they would dissolve into it.
       * The bright token comes back above, as the glow and the button.
       */
      className="from-sale-band to-sale-band-accent text-sale-band-foreground relative my-14 overflow-hidden bg-linear-to-br py-12 lg:py-14"
    >
      {/* Two decorative glows in the bright sale amber give the panel a light
          source, so it reads as a lit surface rather than a flat rectangle. */}
      <div
        aria-hidden
        className="bg-sale/25 pointer-events-none absolute -top-24 -left-20 size-96 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-sale/15 pointer-events-none absolute -right-16 -bottom-32 size-80 rounded-full blur-3xl"
      />

      <Container className="relative">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <p className="text-sale inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
              <Zap className="size-4 fill-current" aria-hidden />
              Limited time
            </p>

            <h2
              id="flash-sale-heading"
              className="font-display mt-2 text-3xl font-bold lg:text-4xl"
            >
              Flash sale
            </h2>

            <p className="mt-2 max-w-md text-sm opacity-80">
              {sale.total} product{sale.total === 1 ? "" : "s"} at a reduced
              price until the clock runs out. Prices go back up on their own.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase opacity-70">
              Ends in
            </p>
            <SaleCountdown endsAt={sale.ends_at} tone="band" />
          </div>
        </div>

        <ProductRail products={sale.items} />

        {/*
         * Always offered, even when the rail already shows everything: a
         * shopper who wants to sort or filter the sale needs the listing, and
         * a "View all" that appears and disappears depending on the count is a
         * navigation item people learn not to look for. The label names the
         * total only when some of it is actually still unseen.
         */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/flash-sale"
            className="group bg-sale text-sale-foreground focus-visible:ring-sale inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition-[transform,opacity] duration-[--duration-base] ease-[--ease-out] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none motion-safe:hover:-translate-y-0.5"
          >
            {unseen > 0 ? `View all ${sale.total} deals` : "View all deals"}
            <ArrowRight
              className="size-4 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </Container>
    </section>
  );
}
