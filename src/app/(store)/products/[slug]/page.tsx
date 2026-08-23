import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/catalog/product-detail";
import { ApiError } from "@/lib/api";
import { serverFetch } from "@/lib/server-api";
import type { Product } from "@/services/catalog";

/**
 * Product detail.
 *
 * Server-rendered for SEO, with the variant picker split out as a Client
 * Component - the only part of this page that needs to react to a click.
 */

async function loadProduct(slug: string): Promise<Product> {
  try {
    return await serverFetch<Product>(`/products/${slug}`);
  } catch (error) {
    // A draft, an archived product, or one whose variants are all inactive all
    // come back as 404 from the API, and all mean the same thing here.
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const product = await serverFetch<Product>(`/products/${slug}`);

    return {
      title: product.seo_title ?? product.name,
      description: product.seo_description ?? product.short_description ?? undefined,
    };
  } catch {
    // Metadata must never be the reason a page fails; the page itself will
    // produce the 404.
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="text-muted-foreground mb-6 text-sm" aria-label="Breadcrumb">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        {product.categories?.[0] && (
          <>
            {" / "}
            <Link
              href={`/categories/${product.categories[0].slug}`}
              className="hover:underline"
            >
              {product.categories[0].name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <ProductDetail product={product} />
    </main>
  );
}
