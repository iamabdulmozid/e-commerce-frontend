import { cn } from "@/lib/utils";

/**
 * The shop's mark, as used by the header and the footer.
 *
 * One component so the two cannot drift, and so the day a real store-settings
 * endpoint exists (the settings phase — until then the store name itself is
 * derived from the subdomain, see `loadStoreName`) there is a single place to
 * swap this file for the tenant's uploaded logo.
 *
 * The image is a demo asset in `public/`, not tenant media, so it is a plain
 * <img> for the same reason as `StoreImage`: next/image buys nothing for a
 * fixed-size static file and would need a loader per tenant domain.
 *
 * Decorative on purpose: both call sites already name the store next to it —
 * the header on the link itself, the footer as visible text — so alt text here
 * would make a screen reader say it twice.
 *
 * `width`/`height` are set even though CSS sizes the box: they hand the
 * browser the intrinsic ratio up front, so the row does not reflow when the
 * mark lands.
 */
export function StoreLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/store-logo.png"
      alt=""
      aria-hidden
      width={512}
      height={512}
      className={cn("size-9 shrink-0 object-contain", className)}
    />
  );
}
