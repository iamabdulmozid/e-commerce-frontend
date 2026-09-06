import { ActiveFilters } from "@/components/catalog/active-filters";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { FilterDrawer } from "@/components/catalog/filter-drawer";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { ButtonLink } from "@/components/ui/button";
import {
  activeFilterCount,
  clearFiltersHref,
  type ListingParam,
  type ListingParams,
} from "@/lib/catalog-query";
import type { Brand, CategoryNode, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * The listing body — filters, toolbar, grid and paging.
 *
 * Shared by /products, /categories/[slug] and /brands/[slug]. Those three
 * pages differ in their heading, their metadata and which filter the route
 * fixes; below that they are the same screen, and keeping three copies of it
 * is how they end up with three different sort controls.
 */
export function ProductListing({
  products,
  categories,
  brands,
  active,
  basePath,
  fixed = [],
}: {
  products: Paginated<Product>;
  categories: CategoryNode[];
  brands: Brand[];
  active: ListingParams;
  basePath: string;
  /** Filters the route owns; hidden from the panel and from the chips. */
  fixed?: ListingParam[];
}) {
  const { total, current_page: page, last_page: lastPage } = products.meta;
  const filterCount = activeFilterCount(active, fixed);

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28">
          <CatalogFilters
            categories={categories}
            brands={brands}
            active={active}
            basePath={basePath}
            fixed={fixed}
          />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="border-border mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-5">
          <div className="flex items-center gap-3">
            <FilterDrawer
              categories={categories}
              brands={brands}
              active={active}
              basePath={basePath}
              fixed={fixed}
              activeCount={filterCount}
            />
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium tabular-nums">
                {total}
              </span>{" "}
              product{total === 1 ? "" : "s"}
            </p>
          </div>

          <SortSelect active={active} basePath={basePath} />
        </div>

        {filterCount > 0 && (
          <div className="mb-6">
            <ActiveFilters
              active={active}
              basePath={basePath}
              categories={categories}
              brands={brands}
              fixed={fixed}
            />
          </div>
        )}

        <ProductGrid
          products={products.items}
          emptyAction={
            filterCount > 0 ? (
              <ButtonLink href={clearFiltersHref(basePath, active)} variant="outline">
                Clear filters
              </ButtonLink>
            ) : undefined
          }
        />

        <Pagination
          page={page}
          lastPage={lastPage}
          basePath={basePath}
          params={active}
        />
      </div>
    </div>
  );
}
