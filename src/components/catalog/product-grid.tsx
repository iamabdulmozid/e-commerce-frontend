import { PackageSearch } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/catalog/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/services/catalog";

/**
 * A grid of product cards.
 *
 * A Server Component with no interactivity of its own: every card is a link,
 * and everything a card shows arrives in the listing payload.
 *
 * The first four cards are marked priority so the images above the fold are
 * not lazy-loaded — lazy-loading the LCP image is a measurable regression, and
 * the fix is one prop.
 */
export function ProductGrid({
  products,
  className,
  emptyAction,
}: {
  products: Product[];
  className?: string;
  /** Offered when nothing matches — usually "clear the filters". */
  emptyAction?: React.ReactNode;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products match"
        description="Try widening the price range, or removing a filter or two."
        action={
          emptyAction ?? (
            <ButtonLink href="/products" variant="outline">
              Browse all products
            </ButtonLink>
          )
        }
      />
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 sm:gap-5",
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}

/** A horizontal rail — used by the home page's product bands. */
export function ProductRail({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <ul className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible lg:grid-cols-4">
      {products.map((product, index) => (
        <li
          key={product.id}
          className="w-[46vw] shrink-0 snap-start sm:w-auto"
        >
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
