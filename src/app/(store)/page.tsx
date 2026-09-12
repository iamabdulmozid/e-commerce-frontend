import { ArrowRight, LayoutGrid, PackageSearch, Sparkles } from "lucide-react";
import Link from "next/link";
import { BrandTile } from "@/components/catalog/brand-tile";
import { HeroCarousel } from "@/components/catalog/hero-carousel";
import { ProductRail } from "@/components/catalog/product-grid";
import { FlashSaleBand } from "@/components/store/flash-sale-band";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StoreImage } from "@/components/ui/store-image";
import { StoreUnavailable } from "@/components/ui/store-unavailable";
import { ApiError } from "@/lib/api";
import { serverFetch } from "@/lib/server-api";
import { loadStoreName } from "@/lib/store-nav";
import type {
  Brand,
  CategoryNode,
  FlashSale,
  Product,
} from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * The storefront home page.
 *
 * Composed entirely from what the store actually has: the hero rotates through
 * the store's own featured photography, the bands come from the `featured`,
 * `new` and `bestseller` flags a merchant sets in the admin, and a band with
 * no products does not render at all (PRD 5B rule 9).
 *
 * The one merchandising band is the flash sale, and it is not hardcoded: it
 * comes from the price rules the merchant actually set, carries the deadline
 * those rules actually have, and does not render at all when nothing is on a
 * timed offer. There is still no "free delivery" strip — delivery is Phase 14,
 * and a claim the merchant never made has no business on their shop.
 */

export const metadata = {
  title: "Home",
};

interface HomeData {
  categories: CategoryNode[];
  brands: Brand[];
  flashSale: FlashSale;
  featured: Product[];
  fresh: Product[];
  bestsellers: Product[];
}

// The sale's own revalidate window is short: everything else on this page is
// merchandising that changes when the merchant edits it, but this band expires
// on a clock, and serving it from a five-minute cache would leave an ended
// sale on the front page.
const SALE_REVALIDATE = 30;

// Enough rotation to be worth having, few enough that a shopper reaches the
// end before losing interest.
const HERO_SLIDES = 5;

async function loadHome(): Promise<HomeData | { unavailable: string }> {
  try {
    // One round of parallel reads: the bands are independent, and serialising
    // them would make the page as slow as their sum.
    const [categories, brands, flashSale, featured, fresh, bestsellers] =
      await Promise.all([
        serverFetch<{ items: CategoryNode[] }>("/categories", 300),
        serverFetch<{ items: Brand[] }>("/brands", 300),
        serverFetch<FlashSale>("/flash-sale", SALE_REVALIDATE),
        serverFetch<Paginated<Product>>("/products?featured=1&per_page=8"),
        serverFetch<Paginated<Product>>("/products?new=1&per_page=8"),
        serverFetch<Paginated<Product>>("/products?bestseller=1&per_page=8"),
      ]);

    return {
      categories: categories.items,
      brands: brands.items,
      flashSale,
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

  const { categories, brands, flashSale, featured, fresh, bestsellers } = data;
  // The hero shows what the merchant chose to feature. A store that has
  // featured nothing yet still gets a picture rather than a grey box, so the
  // newest or best-selling product stands in — one of it, not a slideshow of
  // products nobody nominated.
  const heroProducts =
    featured.length > 0
      ? featured.slice(0, HERO_SLIDES)
      : [fresh[0] ?? bestsellers[0]].filter((p) => p !== undefined);
  const hasAnything = heroProducts.length > 0 || categories.length > 0;

  return (
    <>
      <Hero storeName={storeName} products={heroProducts} />

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

      {/* Above the merchandising bands, and directly under the categories:
          it is the only thing on this page with a deadline, so it goes where
          it is seen before a shopper has scrolled past three rails. Renders
          nothing when no sale is running. */}
      <FlashSaleBand sale={flashSale} />

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
        tone="card"
      />

      <ProductBand
        eyebrow="Popular"
        title="Best sellers"
        href="/products?bestseller=1"
        products={bestsellers}
      />

      {brands.length > 0 && (
        <Container className="pt-14 pb-4">
          <SectionHeader
            eyebrow="Labels"
            title="Shop by brand"
            href="/brands"
          />
          <BrandStrip brands={brands} />
        </Container>
      )}
    </>
  );
}

function Hero({
  storeName,
  products,
}: {
  storeName: string;
  products: Product[];
}) {
  return (
    <section className="from-primary-soft via-background to-background relative overflow-hidden bg-linear-to-br">
      {/* A soft off-centre glow so the hero has a light source instead of a
          flat wash. Decorative and behind everything. */}
      <div
        aria-hidden
        className="bg-primary/10 pointer-events-none absolute -top-40 -right-32 -z-10 size-[36rem] rounded-full blur-3xl"
      />
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

        {/* The hero images are the store's own photography, not stock art baked
            into the theme — a shop should look like itself. Every featured
            product gets its turn instead of only whichever one sorted first. */}
        <HeroCarousel products={products} storeName={storeName} />
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
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {brands.slice(0, 12).map((brand) => (
        <li key={brand.id}>
          <BrandTile brand={brand} className="h-24" />
        </li>
      ))}
    </ul>
  );
}

/**
 * A band of products.
 *
 * `tone` alternates the full-bleed ground between the page and white. A long
 * page of identical bands on one colour reads as a list; alternating gives the
 * eye somewhere to rest and makes each section feel deliberate. The white
 * bands are also where the product tiles stop lifting and sit flush, which is
 * a pleasant change of texture rather than a bug.
 */
function ProductBand({
  eyebrow,
  title,
  href,
  products,
  tone = "page",
}: {
  eyebrow: string;
  title: string;
  href: string;
  products: Product[];
  tone?: "page" | "card";
}) {
  // PRD 5B rule 9: a heading over nothing is worse than no section at all.
  if (products.length === 0) return null;

  return (
    <section
      className={
        tone === "card"
          ? "bg-card border-border/60 my-14 border-y py-14"
          : "pt-14"
      }
    >
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} href={href} />
        <ProductRail products={products} />
      </Container>
    </section>
  );
}
