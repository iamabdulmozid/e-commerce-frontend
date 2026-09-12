"use client";

import { useState } from "react";
import useSWR from "swr";
import { catalogService } from "@/services/catalog";

/**
 * Pick a variant by product and SKU.
 *
 * Two selects rather than one long list: a store with fifty products and four
 * variants each has two hundred options, and a flat list of SKUs is unusable
 * for anyone who thinks in products.
 */
export function VariantPicker({
  value,
  onChange,
  label = "Variant",
}: {
  value: number | null;
  onChange: (variantId: number | null) => void;
  label?: string;
}) {
  const [productId, setProductId] = useState<number | null>(null);

  const { data: products } = useSWR(
    "/admin/products?per_page=200",
    async () => (await catalogService.admin.products({ per_page: 200 })).items,
  );

  const { data: product } = useSWR(
    productId ? `/admin/products/${productId}` : null,
    async () => catalogService.admin.product(productId as number),
  );

  const variants = product?.variants ?? [];

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>

      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={productId ?? ""}
          onChange={(event) => {
            const next = event.target.value ? Number(event.target.value) : null;
            setProductId(next);
            // The chosen variant belongs to the product that just changed, so
            // keeping it would submit a SKU from a different product.
            onChange(null);
          }}
          aria-label="Product"
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Choose a product…</option>
          {products?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value ? Number(event.target.value) : null)
          }
          disabled={!productId || variants.length === 0}
          aria-label="Variant"
          className="border-input bg-background h-9 rounded-md border px-3 text-sm disabled:opacity-50"
        >
          <option value="">
            {productId ? "Choose a variant…" : "Pick a product first"}
          </option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.sku}
              {variant.attributes?.length
                ? ` — ${variant.attributes.map((a) => a.value).join(" / ")}`
                : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
