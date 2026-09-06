import { notFound } from "next/navigation";
import { ProductListing } from "@/components/catalog/product-listing";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { ApiError } from "@/lib/api";
import { pickListingParams, toSearchParams } from "@/lib/catalog-query";
import { serverFetch } from "@/lib/server-api";
import type { Brand, CategoryNode, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Brand landing page — the brand's own URL, with its logo and copy, rather
 * than the generic listing under a filter.
 */

async function loadBrand(slug: string): Promise<Brand> {
  try {
    return await serverFetch<Brand>(`/brands/${slug}`, 300);
  } catch (error) {
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

  // The route owns the brand; see the note on the category page.
  const active = { ...pickListingParams(search), brand: undefined };

  const brand = await loadBrand(slug);

  const query = toSearchParams(active);
  query.set("brand", slug);

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
          { label: "Brands", href: "/brands" },
          { label: brand.name },
        ]}
      />

      <header className="bg-muted/50 mt-6 mb-8 flex flex-wrap items-center gap-6 rounded-2xl p-6 lg:p-8">
        {brand.logo && (
          <div className="bg-card shadow-card flex size-24 shrink-0 items-center justify-center rounded-xl p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.logo.url}
              alt={brand.logo.alt ?? brand.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-3xl font-bold lg:text-4xl">{brand.name}</h1>
          {brand.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              {brand.description}
            </p>
          )}
        </div>
      </header>

      <ProductListing
        products={products}
        categories={tree.items}
        brands={brands.items}
        active={active}
        basePath={`/brands/${slug}`}
        fixed={["brand"]}
      />
    </Container>
  );
}
