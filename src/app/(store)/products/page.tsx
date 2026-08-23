import { ProductGrid } from "@/components/catalog/product-grid";
import { Pagination } from "@/components/catalog/pagination";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { serverFetch } from "@/lib/server-api";
import type { Brand, CategoryNode, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Product listing.
 *
 * A Server Component because this is an SEO-critical page: the markup a
 * crawler sees has to contain the products, not a loading spinner that fetches
 * them afterwards.
 */

export const metadata = {
  title: "Products",
};

const ALLOWED = ["category", "brand", "min_price", "max_price", "sort", "page", "featured", "new"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Only known keys are forwarded. Passing the query string through verbatim
  // would let anyone probe the API with parameters this page never intended
  // to expose.
  const query = new URLSearchParams();
  for (const key of ALLOWED) {
    const value = params[key];
    if (typeof value === "string" && value !== "") query.set(key, value);
  }

  const [products, tree, brands] = await Promise.all([
    serverFetch<Paginated<Product>>(`/products?${query}`),
    serverFetch<{ items: CategoryNode[] }>("/categories", 300),
    serverFetch<{ items: Brand[] }>("/brands", 300),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Products</h1>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <CatalogFilters
          categories={tree.items}
          brands={brands.items}
          active={{
            category: typeof params.category === "string" ? params.category : undefined,
            brand: typeof params.brand === "string" ? params.brand : undefined,
            sort: typeof params.sort === "string" ? params.sort : undefined,
          }}
        />

        <div>
          <div className="text-muted-foreground mb-4 text-sm">
            {products.meta.total} product{products.meta.total === 1 ? "" : "s"}
          </div>

          <ProductGrid products={products.items} />

          <Pagination
            page={products.meta.current_page}
            lastPage={products.meta.last_page}
            basePath="/products"
            query={query}
          />
        </div>
      </div>
    </main>
  );
}
