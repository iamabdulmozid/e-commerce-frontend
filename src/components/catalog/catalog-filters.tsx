import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildListingHref,
  toSearchParams,
  type ListingParam,
  type ListingParams,
} from "@/lib/catalog-query";
import { cn } from "@/lib/utils";
import type { Brand, CategoryNode } from "@/services/catalog";

/**
 * The filter panel — shown as a sidebar from `lg`, and inside a drawer below
 * it. Both surfaces render this exact component, so the two can never drift.
 *
 * Filters are plain links, not a client-side form. Each combination gets its
 * own URL, which is what makes results shareable, bookmarkable and crawlable;
 * a client-side filter model would cost all three and buy nothing, because the
 * results have to be fetched from the server either way.
 *
 * The one exception is the price range, which is a real <form method="get">:
 * two free-text numbers cannot be enumerated as links. It still resolves to a
 * URL, and it still works with JavaScript off.
 */
export function CatalogFilters({
  categories,
  brands,
  active,
  basePath,
  /** Parameters the route itself owns — a category page fixes `category`. */
  fixed = [],
  onNavigate,
}: {
  categories: CategoryNode[];
  brands: Brand[];
  active: ListingParams;
  basePath: string;
  fixed?: ListingParam[];
  /** Lets the drawer close itself when a filter is picked. */
  onNavigate?: () => void;
}) {
  const href = (changes: ListingParams) =>
    buildListingHref(basePath, active, changes);

  return (
    <div className="space-y-7">
      {!fixed.includes("category") && categories.length > 0 && (
        <FilterSection title="Category">
          <FilterLink
            href={href({ category: undefined })}
            active={!active.category}
            onNavigate={onNavigate}
          >
            All categories
          </FilterLink>
          {categories.map((category) => (
            <CategoryLinks
              key={category.id}
              node={category}
              active={active}
              basePath={basePath}
              depth={0}
              onNavigate={onNavigate}
            />
          ))}
        </FilterSection>
      )}

      {!fixed.includes("brand") && brands.length > 0 && (
        <FilterSection title="Brand">
          <FilterLink
            href={href({ brand: undefined })}
            active={!active.brand}
            onNavigate={onNavigate}
          >
            All brands
          </FilterLink>
          {brands.map((brand) => (
            <FilterLink
              key={brand.id}
              href={href({ brand: brand.slug })}
              active={active.brand === brand.slug}
              onNavigate={onNavigate}
            >
              {brand.name}
            </FilterLink>
          ))}
        </FilterSection>
      )}

      <PriceFilter active={active} basePath={basePath} />
    </div>
  );
}

function PriceFilter({
  active,
  basePath,
}: {
  active: ListingParams;
  basePath: string;
}) {
  // Everything except the price bounds and the page travels as hidden inputs,
  // so submitting the form keeps the filters already applied.
  const carried = toSearchParams({
    ...active,
    min_price: undefined,
    max_price: undefined,
    page: undefined,
  });

  return (
    <FilterSection title="Price">
      <form action={basePath} method="get" className="space-y-3">
        {[...carried.entries()].map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            name="min_price"
            aria-label="Minimum price"
            placeholder="Min"
            defaultValue={active.min_price ?? ""}
            className="h-10"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            name="max_price"
            aria-label="Maximum price"
            placeholder="Max"
            defaultValue={active.max_price ?? ""}
            className="h-10"
          />
        </div>

        <Button type="submit" variant="outline" size="sm" full>
          Apply price
        </Button>
      </form>
    </FilterSection>
  );
}

function CategoryLinks({
  node,
  active,
  basePath,
  depth,
  onNavigate,
}: {
  node: CategoryNode;
  active: ListingParams;
  basePath: string;
  depth: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      <FilterLink
        href={buildListingHref(basePath, active, { category: node.slug })}
        active={active.category === node.slug}
        style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
        onNavigate={onNavigate}
      >
        {node.name}
      </FilterLink>

      {node.children.map((child) => (
        <CategoryLinks
          key={child.id}
          node={child}
          active={active}
          basePath={basePath}
          depth={depth + 1}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 px-3 text-xs font-semibold tracking-widest uppercase">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function FilterLink({
  href,
  active,
  style,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  style?: React.CSSProperties;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={style}
      onClick={onNavigate}
      aria-current={active ? "true" : undefined}
      className={cn(
        "block rounded-lg py-2 pr-3 pl-3 text-sm transition-colors",
        active
          ? "bg-primary-soft text-primary-soft-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
