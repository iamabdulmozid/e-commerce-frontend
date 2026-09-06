import { ProductListing } from "@/components/catalog/product-listing";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import {
  pickListingParams,
  toSearchParams,
} from "@/lib/catalog-query";
import { serverFetch } from "@/lib/server-api";
import type { Brand, CategoryNode, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Product listing.
 *
 * A Server Component because this is an SEO-critical page: the markup a
 * crawler sees has to contain the products, not a loading spinner that fetches
 * them afterwards. The interactive parts — sort control and mobile filter
 * drawer — are islands inside it.
 */

export const metadata = {
  title: "Products",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Only known keys are forwarded. Passing the query string through verbatim
  // would let anyone probe the API with parameters this page never intended to
  // expose (PRD 5B rule 14).
  const active = pickListingParams(await searchParams);
  const query = toSearchParams(active);

  const [products, tree, brands] = await Promise.all([
    serverFetch<Paginated<Product>>(`/products?${query}`),
    serverFetch<{ items: CategoryNode[] }>("/categories", 300),
    serverFetch<{ items: Brand[] }>("/brands", 300),
  ]);

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products" }]} />

      <h1 className="mt-4 mb-8 text-3xl font-bold lg:text-4xl">
        {active.q ? `Results for “${active.q}”` : "All products"}
      </h1>

      <ProductListing
        products={products}
        categories={tree.items}
        brands={brands.items}
        active={active}
        basePath="/products"
      />
    </Container>
  );
}
