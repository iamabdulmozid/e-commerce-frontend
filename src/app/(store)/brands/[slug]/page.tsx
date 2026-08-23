import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ApiError } from "@/lib/api";
import { serverFetch } from "@/lib/server-api";
import type { Brand, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Brand landing page — the brand's own URL, with its logo and copy, rather
 * than the generic listing under a filter.
 */

const ALLOWED = ["min_price", "max_price", "sort", "page", "category"];

async function loadBrand(slug: string): Promise<Brand> {
  try {
    return await serverFetch<Brand>(`/brands/${slug}`, 300);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const brand = await serverFetch<Brand>(`/brands/${slug}`, 300);

    return {
      title: brand.seo_title ?? brand.name,
      description: brand.seo_description ?? brand.description ?? undefined,
    };
  } catch {
    return { title: "Brand" };
  }
}

export default async function BrandPage({
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

  const brand = await loadBrand(slug);

  const productQuery = new URLSearchParams(query);
  productQuery.set("brand", slug);

  const products = await serverFetch<Paginated<Product>>(`/products?${productQuery}`);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <nav className="text-muted-foreground mb-6 text-sm" aria-label="Breadcrumb">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        {" / "}
        <span className="text-foreground">{brand.name}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-4">
        {brand.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo.url}
            alt={brand.logo.alt ?? brand.name}
            className="h-16 w-auto max-w-40 object-contain"
          />
        )}
        <h1 className="text-2xl font-bold">{brand.name}</h1>
      </div>

      {brand.description && (
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm">{brand.description}</p>
      )}

      <div className="text-muted-foreground mt-8 mb-4 text-sm">
        {products.meta.total} product{products.meta.total === 1 ? "" : "s"}
      </div>

      <ProductGrid products={products.items} />

      <Pagination
        page={products.meta.current_page}
        lastPage={products.meta.last_page}
        basePath={`/brands/${slug}`}
        query={query}
      />
    </main>
  );
}
