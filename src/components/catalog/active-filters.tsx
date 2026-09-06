import { X } from "lucide-react";
import Link from "next/link";
import {
  buildListingHref,
  clearFiltersHref,
  type ListingParam,
  type ListingParams,
} from "@/lib/catalog-query";
import type { Brand, CategoryNode } from "@/services/catalog";

/**
 * Chips for what is currently filtered, each one a link that removes itself.
 *
 * Without these, a shopper who lands on a filtered URL — from a share, a
 * bookmark, or their own back button — sees a short list of products and no
 * indication why.
 */
export function ActiveFilters({
  active,
  basePath,
  categories,
  brands,
  fixed = [],
}: {
  active: ListingParams;
  basePath: string;
  categories: CategoryNode[];
  brands: Brand[];
  fixed?: ListingParam[];
}) {
  const chips: Array<{ key: ListingParam; label: string; remove: ListingParams }> = [];

  if (active.q) {
    chips.push({
      key: "q",
      label: `“${active.q}”`,
      remove: { q: undefined },
    });
  }

  if (active.category && !fixed.includes("category")) {
    chips.push({
      key: "category",
      label: findCategory(categories, active.category) ?? active.category,
      remove: { category: undefined },
    });
  }

  if (active.brand && !fixed.includes("brand")) {
    chips.push({
      key: "brand",
      label:
        brands.find((brand) => brand.slug === active.brand)?.name ??
        active.brand,
      remove: { brand: undefined },
    });
  }

  if (active.min_price || active.max_price) {
    chips.push({
      key: "min_price",
      label: `${active.min_price ?? "0"} – ${active.max_price ?? "any"}`,
      remove: { min_price: undefined, max_price: undefined },
    });
  }

  for (const flag of ["featured", "new", "bestseller"] as const) {
    if (active[flag]) {
      chips.push({
        key: flag,
        label:
          flag === "new"
            ? "New arrivals"
            : flag === "featured"
              ? "Featured"
              : "Best sellers",
        remove: { [flag]: undefined },
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={buildListingHref(basePath, active, chip.remove)}
          className="border-border hover:border-destructive/40 hover:text-destructive inline-flex items-center gap-1.5 rounded-full border py-1 pr-2 pl-3 text-xs font-medium transition-colors"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}

      {chips.length > 1 && (
        <Link
          href={clearFiltersHref(basePath, active)}
          className="text-muted-foreground hover:text-foreground text-xs font-medium underline underline-offset-4"
        >
          Clear all
        </Link>
      )}
    </div>
  );
}

/** Depth-first search for a slug's display name anywhere in the tree. */
function findCategory(nodes: CategoryNode[], slug: string): string | null {
  for (const node of nodes) {
    if (node.slug === slug) return node.name;

    const found = findCategory(node.children, slug);

    if (found) return found;
  }

  return null;
}
