import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/catalog/product-listing";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { StoreImage } from "@/components/ui/store-image";
import { ApiError } from "@/lib/api";
import { pickListingParams, toSearchParams } from "@/lib/catalog-query";
import { serverFetch } from "@/lib/server-api";
import type { Brand, Category, CategoryNode, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Category landing page.
 *
 * Distinct from `/products?category=…` on purpose: this URL is the one that
 * earns search traffic, so it gets the category's own title, description and
 * banner rather than a generic listing with a filter applied.
 *
 * Products come from the same listing endpoint, which already walks the
 * subtree — a shopper on "Menswear" sees what is filed under "Kurta" too.
 *
 * The category filter is fixed by the route and deliberately kept out of the
 * query string, so this page's URLs stay `/categories/kurta?sort=…` rather
 * than repeating the category in both halves of the address.
 */

async function loadCategory(slug: string): Promise<Category> {
  try {
    return await serverFetch<Category>(`/categories/${slug}`, 300);
  } catch (error) {
    // Inactive and non-existent are the same thing to a shopper.
    if (error instanceof ApiError && error.status === 404) notFound();

    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const category = await serverFetch<Category>(`/categories/${slug}`, 300);

    return {
      title: category.seo_title ?? category.name,
      description: category.seo_description ?? category.description ?? undefined,
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);

  // `category` is dropped: the route owns it, and letting the query string
  // override it would let /categories/shoes list bags.
  const active = { ...pickListingParams(search), category: undefined };

  const category = await loadCategory(slug);

  const query = toSearchParams(active);
  query.set("category", slug);

  const [products, tree, brands] = await Promise.all([
    serverFetch<Paginated<Product>>(`/products?${query}`),
    serverFetch<{ items: CategoryNode[] }>("/categories", 300),
    serverFetch<{ items: Brand[] }>("/brands", 300),
  ]);

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />

      <header className="mt-6 mb-8">
        {category.banner && (
          <StoreImage
            src={category.banner.url}
            alt={category.banner.alt ?? category.name}
            fallbackLabel={category.name}
            ratio="banner"
            priority
            sizes="100vw"
            className="mb-7 rounded-2xl"
          />
        )}

        <h1 className="text-3xl font-bold lg:text-4xl">{category.name}</h1>

        {category.description && (
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {category.description}
          </p>
        )}

        {category.children && category.children.length > 0 && (
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Subcategories">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="border-border hover:border-primary/50 hover:bg-accent rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <ProductListing
        products={products}
        categories={tree.items}
        brands={brands.items}
        active={active}
        basePath={`/categories/${slug}`}
        fixed={["category"]}
      />
    </Container>
  );
}
