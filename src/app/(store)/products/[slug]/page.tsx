import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/catalog/product-detail";
import { ProductRail } from "@/components/catalog/product-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { ApiError } from "@/lib/api";
import { serverFetch } from "@/lib/server-api";
import type { Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Product detail.
 *
 * Server-rendered for SEO, with the gallery and variant picker split out as a
 * Client Component — the only parts of this page that need to react to a
 * click.
 */

async function loadProduct(slug: string): Promise<Product> {
  try {
    return await serverFetch<Product>(`/products/${slug}`);
  } catch (error) {
    // A draft, an archived product, or one whose variants are all inactive all
    // come back as 404 from the API, and all mean the same thing here.
    if (error instanceof ApiError && error.status === 404) notFound();

    throw error;
  }
}

/**
 * Products from the same category, minus this one.
 *
 * Deliberately not a new endpoint (PRD 5B, D7): a real recommender belongs
 * with search in Phase 20, and "more from this category" is honest about what
 * it is.
 */
async function loadRelated(product: Product): Promise<Product[]> {
  const category = product.categories?.[0];

  if (!category) return [];

  try {
    const related = await serverFetch<Paginated<Product>>(
      `/products?category=${encodeURIComponent(category.slug)}&per_page=8`,
    );

    return related.items.filter((item) => item.id !== product.id).slice(0, 4);
  } catch {
    // A recommendation strip is never worth failing a product page over.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const product = await serverFetch<Product>(`/products/${slug}`);
    const title = product.seo_title ?? product.name;
    const description =
      product.seo_description ?? product.short_description ?? undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: product.primary_image?.url
          ? [{ url: product.primary_image.url, alt: product.primary_image.alt }]
          : undefined,
      },
    };
  } catch {
    // Metadata must never be the reason a page fails; the page itself will
    // produce the 404.
    return { title: "Product" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  const related = await loadRelated(product);
  const category = product.categories?.[0];

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          ...(category
            ? [{ label: category.name, href: `/categories/${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeader
            eyebrow="You might also like"
            title={category ? `More in ${category.name}` : "More products"}
            href={category ? `/categories/${category.slug}` : "/products"}
          />
          <ProductRail products={related} />
        </section>
      )}
    </Container>
  );
}
