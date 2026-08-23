import Link from "next/link";
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
  const { items } = await serverFetch<{ items: CategoryNode[] }>("/categories", 300);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing here yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((category) => (
            <li key={category.id}>
              <Link href={`/categories/${category.slug}`} className="group block">
                <div className="bg-muted aspect-[3/2] overflow-hidden rounded-lg">
                  {category.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.image}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                      No image
                    </div>
                  )}
                </div>
                <h2 className="mt-3 font-medium group-hover:underline">{category.name}</h2>
              </Link>

              {category.children.length > 0 && (
                <ul className="text-muted-foreground mt-1 space-y-0.5 text-sm">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/categories/${child.slug}`} className="hover:underline">
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
    </main>
  );
}
