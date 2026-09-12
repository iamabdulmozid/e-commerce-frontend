"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PriceRange } from "@/components/catalog/price";
import { StoreImage } from "@/components/ui/store-image";
import { cn } from "@/lib/utils";
import type { Product } from "@/services/catalog";

/*
 * The hero slider.
 *
 * A shop with eight featured products was showing one of them; the other seven
 * only existed further down the page. This rotates through them in the same
 * frame the single hero image used to occupy.
 *
 * Hand-rolled rather than a carousel package: it is a crossfade over an
 * absolutely positioned stack plus an interval, and pulling in a gesture
 * library for that would cost more bytes on the storefront's LCP path than the
 * whole component.
 *
 * Every slide renders in the DOM at once — hidden slides are `aria-hidden` and
 * removed from the tab order, so a screen reader hears one product, but a
 * crawler still sees all of them and no image has to load mid-rotation.
 */

/** Long enough to read a product name, short enough that the rest get seen. */
const INTERVAL_MS = 6000;
/** Below this a horizontal drag is a scroll, not a swipe. */
const SWIPE_PX = 40;

export function HeroCarousel({
  products,
  storeName,
}: {
  products: Product[];
  storeName: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = products.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;

    // Someone who asked their OS for less motion gets the first featured
    // product and no rotation; the arrows and dots still work if they want the
    // rest.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (still.matches) return;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % count),
      INTERVAL_MS,
    );

    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) {
    return (
      <StoreImage
        src={undefined}
        alt={storeName}
        fallbackLabel={storeName}
        ratio="landscape"
        priority
        fit="contain"
        className="bg-card shadow-pop rounded-2xl p-4"
      />
    );
  }

  return (
    <div
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured products"
      // Pausing on hover and on keyboard focus is the point of the pause: a
      // slide must not move out from under the pointer that is aiming at it.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - (start ?? 0);

        touchStartX.current = null;

        if (start !== null && Math.abs(delta) > SWIPE_PX) {
          go(index + (delta < 0 ? 1 : -1));
        }
      }}
    >
      <div className="relative">
        {products.map((product, position) => (
          <Slide
            key={product.id}
            product={product}
            storeName={storeName}
            active={position === index}
            first={position === 0}
          />
        ))}
      </div>

      {count > 1 && (
        <>
          <Arrow
            side="left"
            label="Previous featured product"
            onClick={() => go(index - 1)}
          />
          <Arrow
            side="right"
            label="Next featured product"
            onClick={() => go(index + 1)}
          />

          <div className="mt-4 flex justify-center gap-2">
            {products.map((product, position) => (
              <button
                key={product.id}
                type="button"
                onClick={() => go(position)}
                aria-label={`Show ${product.name}`}
                aria-current={position === index}
                className={cn(
                  "h-2 rounded-full transition-all duration-[--duration-slow]",
                  position === index
                    ? "bg-primary w-6"
                    : "bg-border hover:bg-muted-foreground/50 w-2",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * One product in the stack.
 *
 * The slides are layered rather than laid out side by side: the first one is
 * in normal flow and gives the frame its height, and the rest are absolutely
 * positioned over it. That keeps the hero exactly the size the old single
 * image was, whatever the tallest product photograph happens to be.
 */
function Slide({
  product,
  storeName,
  active,
  first,
}: {
  product: Product;
  storeName: string;
  active: boolean;
  first: boolean;
}) {
  return (
    <div
      className={cn(
        "transition-opacity duration-[--duration-slow] ease-[--ease-out]",
        first ? "relative" : "absolute inset-0",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!active}
      inert={!active}
    >
      <StoreImage
        src={product.primary_image?.url}
        alt={product.primary_image?.alt ?? product.name}
        fallbackLabel={storeName}
        ratio="landscape"
        // Only the visible slide is on the LCP path; the others are lazy so a
        // shop with eight featured products does not open eight requests.
        priority={first}
        sizes="(min-width: 1024px) 45vw, 100vw"
        // A product, not a scene: cropping a portrait clothing shot into a
        // landscape frame keeps the midriff and loses the face.
        fit="contain"
        className="bg-card shadow-pop rounded-2xl p-4"
      />

      <Link
        href={`/products/${product.slug}`}
        tabIndex={active ? undefined : -1}
        className="bg-card/95 shadow-pop hover:bg-card absolute bottom-4 left-4 max-w-[80%] rounded-xl px-4 py-3 text-sm backdrop-blur transition-colors"
      >
        <p className="text-muted-foreground text-xs">Featured</p>
        <p className="truncate font-medium">{product.name}</p>
        {product.price_range && (
          <PriceRange range={product.price_range} className="mt-1" />
        )}
      </Link>
    </div>
  );
}

function Arrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "bg-card/90 text-foreground shadow-pop hover:bg-card absolute top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur transition-colors",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="size-5" />
      ) : (
        <ChevronRight className="size-5" />
      )}
    </button>
  );
}
