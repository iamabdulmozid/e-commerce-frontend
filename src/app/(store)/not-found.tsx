import { Compass, LayoutGrid, PackageSearch } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * The storefront's own 404.
 *
 * Distinct from the root one so a missing product still renders inside the
 * shop - header, navigation and footer intact - rather than dropping the
 * shopper onto a bare page with no way back into the catalogue.
 */
export default function StoreNotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <span className="bg-primary-soft text-primary-soft-foreground mb-6 flex size-16 items-center justify-center rounded-2xl">
        <Compass className="size-8" aria-hidden />
      </span>

      <p className="text-muted-foreground font-mono text-sm">404</p>
      <h1 className="mt-2 text-3xl font-bold lg:text-4xl">
        We couldn&apos;t find that
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        This product or page is no longer available. It may have been removed,
        or the link may be out of date.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/products">
          <PackageSearch />
          Browse products
        </ButtonLink>
        <ButtonLink href="/categories" variant="outline">
          <LayoutGrid />
          Shop by category
        </ButtonLink>
      </div>
    </Container>
  );
}
