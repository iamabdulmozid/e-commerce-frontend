import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Brand } from "@/services/catalog";

/**
 * One brand, as a tile.
 *
 * The logo is the tile when there is one: it gets the whole box, and the brand
 * name drops to screen-reader-only text. Printing the name underneath a logo
 * that already says it is redundant for a sighted shopper and noise for a
 * screen reader, which would read the mark's alt text and then the same words
 * again.
 *
 * When there is no logo the fallback is a wordmark, not a monogram-and-caption.
 * A brand strip is a row of marks, so the substitute has to read as a mark —
 * the name set large in the display face, letterspaced, centred. That looks
 * deliberate next to a real logo; a small initial in a circle with the name
 * beneath it looks like a list that lost its styling.
 *
 * Shared by the home page strip and /brands so the two cannot drift.
 */
export function BrandTile({
  brand,
  className,
}: {
  brand: Brand;
  className?: string;
}) {
  // `url` is already the medium conversion (BrandResource), and conversions
  // never enlarge — so for a small logo this is the original at native size.
  const logo = brand.logo?.url ?? brand.logo?.thumb_url;

  return (
    <Link
      href={`/brands/${brand.slug}`}
      className={cn(
        "group border-border/70 bg-card shadow-card flex items-center justify-center rounded-2xl border p-5",
        "transition-[box-shadow,border-color,transform] duration-[--duration-base] ease-[--ease-out]",
        "hover:shadow-pop hover:border-border motion-safe:hover:-translate-y-0.5",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      {logo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt={brand.name}
            loading="lazy"
            /*
             * `object-contain` with a height cap, never a width stretch: logos
             * arrive at wildly different aspect ratios and the one thing that
             * makes a strip look cheap is a squashed mark.
             */
            className="max-h-12 w-auto max-w-full object-contain"
          />
          <span className="sr-only">{brand.name}</span>
        </>
      ) : (
        <span
          className={cn(
            "font-display group-hover:text-primary text-center text-base font-bold tracking-[0.14em] uppercase transition-colors",
            // Long names would otherwise break the tile's height.
            brand.name.length > 8 && "text-sm tracking-[0.1em]",
          )}
        >
          {brand.name}
        </span>
      )}
    </Link>
  );
}
