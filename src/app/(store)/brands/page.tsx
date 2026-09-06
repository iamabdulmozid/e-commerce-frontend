import { Tag } from "lucide-react";
import Link from "next/link";
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
              <Link
                href={`/brands/${brand.slug}`}
                className="border-border hover:border-primary/40 hover:shadow-card group flex h-36 flex-col items-center justify-center gap-3 rounded-xl border p-5 text-center transition-all"
              >
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo.thumb_url}
                    alt=""
                    loading="lazy"
                    className="h-12 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="bg-primary-soft text-primary-soft-foreground font-display flex size-12 items-center justify-center rounded-full text-lg font-bold">
                    {brand.name.slice(0, 1).toUpperCase()}
                  </span>
                )}

                <span className="group-hover:text-primary text-sm font-medium transition-colors">
                  {brand.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
