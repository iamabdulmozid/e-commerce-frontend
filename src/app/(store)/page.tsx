import { ArrowRight, LayoutGrid, PackageSearch, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProductRail } from "@/components/catalog/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StoreImage } from "@/components/ui/store-image";
import { StoreUnavailable } from "@/components/ui/store-unavailable";
import { ApiError } from "@/lib/api";
import { serverFetch } from "@/lib/server-api";
import { loadStoreName } from "@/lib/store-nav";
import type { Brand, CategoryNode, Product } from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * The storefront home page.
 *
 * Composed entirely from what the store actually has: the hero borrows the
 * first featured product's photograph, the bands come from the `featured`,
 * `new` and `bestseller` flags a merchant sets in the admin, and a band with
 * no products does not render at all (PRD 5B rule 9).
 *
 * There is no promotional banner, no countdown and no "free delivery" strip.
 * Promotions are Phase 6 and delivery is Phase 14; hardcoding either would put
 * a claim on a real merchant's shop that the merchant never made.
 */

export const metadata = {
  title: "Home",
};

interface HomeData {
  categories: CategoryNode[];
  brands: Brand[];
  featured: Product[];
  fresh: Product[];
  bestsellers: Product[];
}

async function loadHome(): Promise<HomeData | { unavailable: string }> {
  try {
    // One round of parallel reads: the bands are independent, and serialising
    // them would make the page as slow as their sum.
    const [categories, brands, featured, fresh, bestsellers] = await Promise.all([
      serverFetch<{ items: CategoryNode[] }>("/categories", 300),
      serverFetch<{ items: Brand[] }>("/brands", 300),
      serverFetch<Paginated<Product>>("/products?featured=1&per_page=8"),
      serverFetch<Paginated<Product>>("/products?new=1&per_page=8"),
      serverFetch<Paginated<Product>>("/products?bestseller=1&per_page=8"),
    ]);

    return {
      categories: categories.items,
      brands: brands.items,
      featured: featured.items,
      fresh: fresh.items,
      bestsellers: bestsellers.items,
    };
  } catch (error) {
    // A store that is provisioning, suspended or past due gets its own screen
    // rather than the error boundary — it is not a fault, it is a state.
    if (error instanceof ApiError && error.isStoreUnavailable) {
      return { unavailable: error.code ?? "" };
    }

    throw error;
  }
}

export default async function StoreHomePage() {
  const [data, storeName] = await Promise.all([loadHome(), loadStoreName()]);

  if ("unavailable" in data) {
    return <StoreUnavailable code={data.unavailable} />;
  }

  const { categories, brands, featured, fresh, bestsellers } = data;
  const heroProduct = featured[0] ?? fresh[0] ?? bestsellers[0];
  const hasAnything = Boolean(heroProduct) || categories.length > 0;

  return (
    <>
      <Hero storeName={storeName} product={heroProduct} />

      {!hasAnything && (
        <Container className="py-24">
          <EmptyState
            icon={PackageSearch}
            title="This store has no products yet"
            description="Once the shop owner publishes a catalogue, it will appear right here."
          />
        </Container>
      )}

      {categories.length > 0 && (
        <Container className="pt-14">
          <SectionHeader
            eyebrow="Browse"
            title="Shop by category"
            href="/categories"
          />
          <CategoryTiles categories={categories} />
        </Container>
      )}

      <ProductBand
        eyebrow="Handpicked"
        title="Featured products"
        href="/products?featured=1"
        products={featured}
      />

      <ProductBand
        eyebrow="Just in"
        title="New arrivals"
        href="/products?new=1"
        products={fresh}
      />

      <ProductBand
        eyebrow="Popular"
        title="Best sellers"
        href="/products?bestseller=1"
        products={bestsellers}
      />

      {brands.length > 0 && (
        <Container className="pt-14 pb-4">
          <SectionHeader eyebrow="Labels" title="Shop by brand" href="/brands" />
          <BrandStrip brands={brands} />
        </Container>
      )}
    </>
  );
}

function Hero({
  storeName,
  product,
}: {
  storeName: string;
  product: Product | undefined;
}) {
  return (
    <section className="from-primary-soft via-background to-background bg-linear-to-br">
      <Container className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-primary inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
            <Sparkles className="size-4" aria-hidden />
            {storeName}
          </p>

          <h1 className="mt-4 text-4xl font-bold lg:text-5xl">
            Everything in the shop, in one place.
          </h1>

          <p className="text-muted-foreground mt-4 max-w-md">
            Browse the full catalogue by category, brand or price. Every price
            you see is the price this store is charging right now.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/products" size="lg">
              Browse products
              <ArrowRight />
            </ButtonLink>
            <ButtonLink href="/categories" size="lg" variant="outline">
              <LayoutGrid />
              Shop by category
            </ButtonLink>
          </div>
        </div>

        {/* The hero image is the store's own photography, not stock art baked
            into the theme — a shop should look like itself. */}
        <div className="relative">
          <StoreImage
            src={product?.primary_image?.url}
            alt={product?.primary_image?.alt ?? storeName}
            fallbackLabel={storeName}
            ratio="landscape"
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="shadow-pop rounded-2xl"
          />

          {product && (
            <Link
              href={`/products/${product.slug}`}
              className="bg-card/95 shadow-pop hover:bg-card absolute bottom-4 left-4 max-w-[80%] rounded-xl px-4 py-3 text-sm backdrop-blur transition-colors"
            >
              <p className="text-muted-foreground text-xs">Featured</p>
              <p className="truncate font-medium">{product.name}</p>
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}

function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="scrollbar-none -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
      {categories.slice(0, 10).map((category) => (
        <li key={category.id} className="w-40 shrink-0 sm:w-auto">
          <Link href={`/categories/${category.slug}`} className="group block">
            <StoreImage
              src={category.image}
              alt={category.name}
              fallbackLabel={category.name}
              ratio="square"
              sizes="(min-width: 1024px) 18vw, 40vw"
              imageClassName="transition-transform duration-[--duration-slow] ease-[--ease-out] group-hover:scale-[1.05]"
            />
            <p className="group-hover:text-primary mt-2.5 text-center text-sm font-medium transition-colors">
              {category.name}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BrandStrip({ brands }: { brands: Brand[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {brands.slice(0, 12).map((brand) => (
        <li key={brand.id}>
          <Link
            href={`/brands/${brand.slug}`}
            className="border-border hover:border-primary/40 hover:bg-accent flex h-24 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-colors"
          >
            {brand.logo?.thumb_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo.thumb_url}
                alt=""
                loading="lazy"
                className="h-8 w-auto max-w-full object-contain"
              />
            )}
            <span className="truncate text-sm font-medium">{brand.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProductBand({
  eyebrow,
  title,
  href,
  products,
}: {
  eyebrow: string;
  title: string;
  href: string;
  products: Product[];
}) {
  // PRD 5B rule 9: a heading over nothing is worse than no section at all.
  if (products.length === 0) return null;

  return (
    <Container className="pt-14">
      <SectionHeader eyebrow={eyebrow} title={title} href={href} />
      <ProductRail products={products} />
    </Container>
  );
}
