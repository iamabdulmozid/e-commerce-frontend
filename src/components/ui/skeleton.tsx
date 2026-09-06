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

/** A product card's shape, used by every listing's loading state. */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
