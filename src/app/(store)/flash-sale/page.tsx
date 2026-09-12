import { Zap } from "lucide-react";
import { ProductListing } from "@/components/catalog/product-listing";
import { SaleCountdown } from "@/components/store/sale-countdown";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { pickListingParams, toSearchParams } from "@/lib/catalog-query";
import { serverFetch } from "@/lib/server-api";
import type {
  Brand,
  CategoryNode,
  FlashSale,
  Product,
} from "@/services/catalog";
import type { Paginated } from "@/types/auth";

/**
 * Every product in the flash sale.
 *
 * Where the home page band goes, with the same countdown at the top so the
 * deadline does not vanish the moment a shopper acts on it.
 *
 * Below the header this is the ordinary listing — the same filters, sort and
 * paging as /products, with `flash_sale` fixed by the route. That reuse is the
 * point: a sale of forty products is useless without a way to narrow it, and a
 * bespoke grid here would be the fourth copy of a screen that already exists
 * three times.
 *
 * The listing is fetched separately from the sale window rather than paged out
 * of /flash-sale, because the shopper's filters apply to the products and not
 * to the deadline. Both reads are tenant-scoped and cached by `serverFetch`.
 */

export const metadata = {
  title: "Flash sale",
  description: "Time-limited offers, while they last.",
};

// Short. A listing whose whole premise is a deadline should not be served from
// a cache older than the countdown beside it — this is the one storefront page
// where a stale minute is a wrong price.
const REVALIDATE = 30;

export default async function FlashSalePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const active = pickListingParams(await searchParams);

  // The route owns this filter, so it is set here rather than read from the
  // query string — the same allow-list discipline /products follows.
  const query = toSearchParams({ ...active, flash_sale: "1" });

  const [sale, products, tree, brands] = await Promise.all([
    serverFetch<FlashSale>("/flash-sale", REVALIDATE),
    serverFetch<Paginated<Product>>(`/products?${query}`, REVALIDATE),
    serverFetch<{ items: CategoryNode[] }>("/categories", 300),
    serverFetch<{ items: Brand[] }>("/brands", 300),
  ]);

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Flash sale" }]}
      />

      <SaleHeader endsAt={sale.ends_at} total={sale.total} />

      {sale.ends_at === null ? (
        <EmptyState
          icon={Zap}
          title="No flash sale right now"
          description="Nothing in the shop is on a time-limited offer at the moment. The full catalogue is still here."
          action={<ButtonLink href="/products">Browse all products</ButtonLink>}
        />
      ) : (
        <ProductListing
          products={products}
          categories={tree.items}
          brands={brands.items}
          active={active}
          basePath="/flash-sale"
          // Hidden from the filter panel and the chips: a "remove" link on the
          // filter that defines the page would quietly navigate the shopper
          // out of the sale they came for.
          fixed={["flash_sale"]}
        />
      )}
    </Container>
  );
}

/**
 * The heading and the clock.
 *
 * A tinted card rather than the dark band from the home page: this is already
 * a page about the sale, so it does not need to announce itself against
 * competing sections, and a full-bleed dark panel above a filter sidebar would
 * fight the listing for attention.
 */
function SaleHeader({
  endsAt,
  total,
}: {
  endsAt: string | null;
  total: number;
}) {
  return (
    <div className="border-sale/40 bg-sale-soft mt-4 mb-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-2xl border p-6">
      <div className="min-w-0">
        <p className="text-sale-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
          <Zap className="size-4 fill-current" aria-hidden />
          Limited time
        </p>

        <h1 className="font-display mt-1.5 text-3xl font-bold lg:text-4xl">
          Flash sale
        </h1>

        {endsAt !== null && (
          <p className="text-muted-foreground mt-1.5 text-sm">
            {total} product{total === 1 ? "" : "s"} on offer. Prices return to
            normal when the clock runs out.
          </p>
        )}
      </div>

      {endsAt !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
            Ends in
          </p>
          <SaleCountdown endsAt={endsAt} tone="page" />
        </div>
      )}
    </div>
  );
}
