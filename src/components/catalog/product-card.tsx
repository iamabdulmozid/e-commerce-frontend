import Link from "next/link";
import { PriceRange } from "@/components/catalog/price";
import { Badge } from "@/components/ui/badge";
import { StoreImage } from "@/components/ui/store-image";
import { cn } from "@/lib/utils";
import type { Product } from "@/services/catalog";

/**
 * One product, as a card.
 *
 * Everything shown here comes from the listing payload - which is exactly why
 * the API sends a resolved price range and a primary image instead of making
 * the browser reduce over variants (engineering rule 41).
 *
 * Note what is *not* here: no Sale badge, no rating, no stock line. The
 * listing payload carries no discount flag, no reviews exist yet and stock is
 * Phase 7. A card that showed any of them would be inventing it (PRD 5B
 * rule 10). The discount only appears on the detail page, where `pricing`
 * actually says so.
 *
 * The whole card is a single link, with no nested interactive elements - a
 * button inside a link is unreachable for a keyboard and ambiguous for a
 * screen reader.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  /** Set on the first row of the first screen so the LCP image is not lazy. */
  priority?: boolean;
}) {
  const badge = product.is_new_arrival
    ? { tone: "new" as const, label: "New" }
    : product.is_bestseller
      ? { tone: "primary" as const, label: "Bestseller" }
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group focus-visible:ring-ring block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none"
    >
      <div className="relative">
        <StoreImage
          src={product.primary_image?.url}
          alt={product.primary_image?.alt ?? product.name}
          fallbackLabel={product.name}
          priority={priority}
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 45vw"
          className="bg-muted"
          imageClassName={cn(
            "transition-transform duration-[--duration-slow] ease-[--ease-out]",
            "group-hover:scale-[1.04]",
          )}
        />

        {badge && (
          <Badge tone={badge.tone} size="sm" className="absolute top-3 left-3">
            {badge.label}
          </Badge>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {product.brand && (
          <p className="text-muted-foreground truncate text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
            {product.brand.name}
          </p>
        )}

        <h3 className="group-hover:text-primary line-clamp-2-safe text-sm leading-snug font-medium transition-colors">
          {product.name}
        </h3>

        <PriceRange range={product.price_range} className="pt-0.5" />
      </div>
    </Link>
  );
}
