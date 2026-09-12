import { cn } from "@/lib/utils";

/**
 * A placeholder shaped like the thing that is coming.
 *
 * Skeletons only help when they match the final layout - a generic grey block
 * where a two-line title will land still moves the page when data arrives,
 * which is the cost a skeleton exists to avoid. Callers size these to match.
 *
 * The shimmer is a background animation, so `prefers-reduced-motion` in
 * globals.css switches it off without this component knowing.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("bg-muted shimmer rounded-lg", className)}
      {...props}
    />
  );
}

/**
 * A product card's shape — the same tile, padding and radii the real card
 * uses, so the grid does not visibly reflow the moment data lands.
 */
export function ProductCardSkeleton() {
  return (
    <div className="border-border/70 bg-card shadow-card rounded-2xl border p-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-2 px-1 pt-3.5 pb-1">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
