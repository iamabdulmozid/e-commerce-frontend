import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { StoreImage } from "@/components/ui/store-image";
import { serverFetch } from "@/lib/server-api";
import type { CategoryNode } from "@/services/catalog";

/**
 * The category index — the crawlable entry point into every category page.
 *
 * Renders the whole active tree because it is small by construction: the depth
 * cap is three levels, so there is nothing here worth paginating.
 */

export const metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const { items } = await serverFetch<{ items: CategoryNode[] }>(
    "/categories",
    300,
  );

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />

      <h1 className="mt-4 mb-8 text-3xl font-bold lg:text-4xl">
        Shop by category
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No categories yet"
          description="This store has not organised its catalogue into categories."
        />
      ) : (
        <ul className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((category, index) => (
            <li key={category.id}>
              <Link href={`/categories/${category.slug}`} className="group block">
                <StoreImage
                  src={category.image}
                  alt={category.name}
                  fallbackLabel={category.name}
                  ratio="landscape"
                  priority={index < 3}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  imageClassName="transition-transform duration-[--duration-slow] ease-[--ease-out] group-hover:scale-[1.04]"
                />
                <h2 className="group-hover:text-primary mt-3 text-lg font-semibold transition-colors">
                  {category.name}
                </h2>
              </Link>

              {category.children.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
