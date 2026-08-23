import Link from "next/link";
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
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">Brands</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing here yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((brand) => (
            <li key={brand.id}>
              <Link
                href={`/brands/${brand.slug}`}
                className="hover:bg-accent flex h-28 flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center"
              >
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo.thumb_url}
                    alt=""
                    className="h-10 w-auto max-w-full object-contain"
                    loading="lazy"
                  />
                ) : null}
                <span className="text-sm font-medium">{brand.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
