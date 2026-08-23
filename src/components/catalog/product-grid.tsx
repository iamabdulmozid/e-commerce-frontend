import Link from "next/link";
import { priceLabel, type Product } from "@/services/catalog";

/**
 * Product cards.
 *
 * A Server Component with no interactivity: everything a card shows comes from
 * the listing payload, which is exactly why the API sends a price range and a
 * primary image rather than making the client reduce over variants.
 */
export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Nothing matches those filters.
      </p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <Link href={`/products/${product.slug}`} className="group block">
            <div className="bg-muted aspect-square overflow-hidden rounded-lg">
              {product.primary_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.primary_image.url}
                  alt={product.primary_image.alt}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  No image
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1">
              {product.brand && (
                <p className="text-muted-foreground text-xs uppercase">{product.brand.name}</p>
              )}
              <h2 className="font-medium group-hover:underline">{product.name}</h2>
              <p className="text-sm tabular-nums">{priceLabel(product.price_range)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
