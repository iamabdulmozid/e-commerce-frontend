import { Tag } from "lucide-react";
import { BrandTile } from "@/components/catalog/brand-tile";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { serverFetch } from "@/lib/server-api";
import type { Brand } from "@/services/catalog";

/**
 * The brand index — the crawlable entry point into every brand page.
 */

export const metadata = {
  title: "Brands",
};

export default async function BrandsPage() {
  const { items } = await serverFetch<{ items: Brand[] }>("/brands", 300);

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />

      <h1 className="mt-4 mb-8 text-3xl font-bold lg:text-4xl">Shop by brand</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No brands yet"
          description="This store has not added any brands to its catalogue."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((brand) => (
            <li key={brand.id}>
              <BrandTile brand={brand} className="h-32" />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
