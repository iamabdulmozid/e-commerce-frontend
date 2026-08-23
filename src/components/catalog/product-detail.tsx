"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Product, Variant } from "@/services/catalog";

/**
 * Product detail with a variant picker.
 *
 * The one interactive part of an otherwise server-rendered page: choosing
 * "Black" then "M" has to resolve to a specific variant, and swap the price
 * and gallery with it.
 *
 * Combinations that do not exist are disabled rather than hidden. A shopper
 * who picked Black and finds Size L greyed out learns something ("that one is
 * not made in L"); one who finds L silently missing just thinks the page is
 * broken.
 */
export function ProductDetail({ product }: { product: Product }) {
  const variants = useMemo(() => product.variants ?? [], [product.variants]);

  // Group the attribute options across every variant, preserving order.
  const attributes = useMemo(() => {
    const map = new Map<
      number,
      { id: number; name: string; values: Map<number, { id: number; value: string; hex: string | null }> }
    >();

    for (const variant of variants) {
      for (const attribute of variant.attributes) {
        if (!map.has(attribute.attribute_id)) {
          map.set(attribute.attribute_id, {
            id: attribute.attribute_id,
            name: attribute.attribute ?? "Option",
            values: new Map(),
          });
        }

        map.get(attribute.attribute_id)!.values.set(attribute.value_id, {
          id: attribute.value_id,
          value: attribute.value,
          hex: attribute.color_hex,
        });
      }
    }

    return [...map.values()].map((a) => ({ ...a, values: [...a.values.values()] }));
  }, [variants]);

  const [selection, setSelection] = useState<Record<number, number>>(() => {
    const initial = variants.find((v) => v.is_default) ?? variants[0];
    const picked: Record<number, number> = {};

    for (const attribute of initial?.attributes ?? []) {
      picked[attribute.attribute_id] = attribute.value_id;
    }

    return picked;
  });

  const selected = useMemo(() => findVariant(variants, selection), [variants, selection]);

  const images = useMemo(() => {
    const all = product.images ?? [];

    // Images bound to the chosen variant win; otherwise show the unbound ones,
    // so a colour swap changes the gallery without emptying it.
    const forVariant = selected ? all.filter((i) => i.variant_id === selected.id) : [];

    return forVariant.length > 0 ? forVariant : all.filter((i) => i.variant_id === null);
  }, [product.images, selected]);

  const [activeImage, setActiveImage] = useState(0);
  const gallery = images.length > 0 ? images : (product.images ?? []);
  const current = gallery[Math.min(activeImage, gallery.length - 1)];

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="bg-muted aspect-square overflow-hidden rounded-lg">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={current.alt} className="h-full w-full object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              No image
            </div>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {gallery.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                className={cn(
                  "size-16 shrink-0 overflow-hidden rounded border",
                  index === activeImage ? "border-primary" : "border-transparent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.thumb_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          {product.brand && (
            <p className="text-muted-foreground text-sm uppercase">{product.brand.name}</p>
          )}
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.short_description && (
            <p className="text-muted-foreground mt-2">{product.short_description}</p>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular-nums">
            {selected ? `BDT ${selected.price}` : "—"}
          </span>
          {selected?.compare_price && (
            <span className="text-muted-foreground text-lg line-through tabular-nums">
              BDT {selected.compare_price}
            </span>
          )}
        </div>

        {attributes.map((attribute) => (
          <div key={attribute.id}>
            <p className="mb-2 text-sm font-medium">{attribute.name}</p>
            <div className="flex flex-wrap gap-2">
              {attribute.values.map((value) => {
                const available = isAvailable(variants, selection, attribute.id, value.id);
                const isSelected = selection[attribute.id] === value.id;

                return (
                  <button
                    key={value.id}
                    disabled={!available}
                    onClick={() =>
                      setSelection((current) => ({ ...current, [attribute.id]: value.id }))
                    }
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm",
                      isSelected && "border-primary bg-accent font-medium",
                      !available && "cursor-not-allowed opacity-40 line-through",
                    )}
                  >
                    {value.hex && (
                      <span
                        aria-hidden
                        className="mr-2 inline-block size-3 rounded-full border align-middle"
                        style={{ backgroundColor: value.hex }}
                      />
                    )}
                    {value.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="border-t pt-4">
          {/*
            Stock and add-to-cart are Phases 7 and 8. Saying "in stock" here
            would be a guess, and a guess about availability is the one thing
            a storefront must not do.
          */}
          <p className="text-muted-foreground text-sm">
            {selected ? `SKU ${selected.sku}` : "Choose an option"}
          </p>
        </div>

        {product.description && (
          <div className="border-t pt-6">
            <h2 className="mb-2 font-medium">Description</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** The variant whose combination matches every current selection. */
function findVariant(variants: Variant[], selection: Record<number, number>): Variant | null {
  const picked = Object.entries(selection);

  return (
    variants.find((variant) =>
      picked.every(([attributeId, valueId]) =>
        variant.attributes.some(
          (a) => a.attribute_id === Number(attributeId) && a.value_id === valueId,
        ),
      ),
    ) ?? (picked.length === 0 ? (variants[0] ?? null) : null)
  );
}

/**
 * Would picking this value still leave a real variant, given everything else
 * already chosen?
 */
function isAvailable(
  variants: Variant[],
  selection: Record<number, number>,
  attributeId: number,
  valueId: number,
): boolean {
  const hypothetical = { ...selection, [attributeId]: valueId };

  return variants.some((variant) =>
    Object.entries(hypothetical).every(([id, value]) =>
      variant.attributes.some((a) => a.attribute_id === Number(id) && a.value_id === value),
    ),
  );
}
