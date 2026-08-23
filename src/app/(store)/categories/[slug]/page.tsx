import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ApiError } from "@/lib/api";
import { serverFetch } from "@/lib/server-api";
import type { Category, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Category landing page.
 *
 * Distinct from `/products?category=…` on purpose: this URL is the one that
 * earns search traffic, so it gets the category's own title, description and
 * banner rather than a generic listing with a filter applied.
 *
 * Products come from the same listing endpoint, which already walks the
 * subtree - a shopper on "Menswear" sees what is filed under "Kurta" too.
 */

const ALLOWED = ["min_price", "max_price", "sort", "page", "brand"];

async function loadCategory(slug: string): Promise<Category> {
  try {
    return await serverFetch<Category>(`/categories/${slug}`, 300);
  } catch (error) {
    // Inactive and non-existent are the same thing to a shopper.
    if (error instanceof ApiError && error.status === 404) notFound();

    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
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

  const query = new URLSearchParams();
  for (const key of ALLOWED) {
    const value = search[key];
    if (typeof value === "string" && value !== "") query.set(key, value);
  }

  const category = await loadCategory(slug);

  // The category filter is fixed by the route, so it is set after the
  // allow-list rather than read from the query string.
  const productQuery = new URLSearchParams(query);
  productQuery.set("category", slug);

  const products = await serverFetch<Paginated<Product>>(`/products?${productQuery}`);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <nav className="text-muted-foreground mb-6 text-sm" aria-label="Breadcrumb">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        {" / "}
        <span className="text-foreground">{category.name}</span>
      </nav>

      {category.banner && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.banner.url}
          alt={category.banner.alt ?? ""}
          className="mb-6 max-h-64 w-full rounded-lg object-cover"
        />
      )}

      <h1 className="text-2xl font-bold">{category.name}</h1>

      {category.description && (
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {category.description}
        </p>
      )}

      {category.children && category.children.length > 0 && (
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Subcategories">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="hover:bg-accent rounded-full border px-3 py-1 text-sm"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="text-muted-foreground mt-8 mb-4 text-sm">
        {products.meta.total} product{products.meta.total === 1 ? "" : "s"}
      </div>

      <ProductGrid products={products.items} />

      <Pagination
        page={products.meta.current_page}
        lastPage={products.meta.last_page}
        basePath={`/categories/${slug}`}
        query={query}
      />
    </main>
  );
}
