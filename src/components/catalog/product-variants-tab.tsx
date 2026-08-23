"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { catalogService, type Product, type Variant } from "@/services/catalog";

type Runner = (action: () => Promise<unknown>, success: string) => Promise<boolean>;

/**
 * Variants: the rows that actually get sold.
 *
 * The generator is the primary path - picking Colour {Black, White} and Size
 * {S, M} and getting four rows beats typing four SKUs by hand. Editing price
 * and status per row is inline, because that is what merchants do daily.
 */
export function ProductVariantsTab({ product, onRun }: { product: Product; onRun: Runner }) {
  const variants = product.variants ?? [];

  return (
    <div className="space-y-5">
      <MatrixGenerator product={product} onRun={onRun} />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Options</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Compare at</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {variants.map((variant) => (
              <VariantRow
                key={variant.id}
                product={product}
                variant={variant}
                canDelete={variants.length > 1}
                onRun={onRun}
              />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function VariantRow({
  product,
  variant,
  canDelete,
  onRun,
}: {
  product: Product;
  variant: Variant;
  canDelete: boolean;
  onRun: Runner;
}) {
  const [price, setPrice] = useState(variant.price);
  const [compare, setCompare] = useState(variant.compare_price ?? "");
  const [sku, setSku] = useState(variant.sku);
  const [saving, setSaving] = useState(false);

  const dirty =
    price !== variant.price ||
    sku !== variant.sku ||
    compare !== (variant.compare_price ?? "");

  return (
    <tr>
      <td className="px-4 py-2">
        {variant.attributes.length === 0 ? (
          <span className="text-muted-foreground">Default</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {variant.attributes.map((attribute) => (
              <span key={attribute.value_id} className="bg-muted rounded px-2 py-0.5 text-xs">
                {attribute.value}
              </span>
            ))}
          </span>
        )}
        {variant.is_default && (
          <span className="text-muted-foreground ml-2 text-xs">default</span>
        )}
      </td>

      <td className="px-4 py-2">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="border-input bg-background h-8 w-32 rounded-md border px-2 font-mono text-xs"
        />
      </td>

      <td className="px-4 py-2">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          className="border-input bg-background h-8 w-24 rounded-md border px-2 text-right tabular-nums"
        />
      </td>

      <td className="px-4 py-2">
        <input
          value={compare}
          onChange={(e) => setCompare(e.target.value)}
          inputMode="decimal"
          placeholder="—"
          className="border-input bg-background h-8 w-24 rounded-md border px-2 text-right tabular-nums"
        />
      </td>

      <td className="px-4 py-2">
        <select
          value={variant.status}
          onChange={(e) =>
            onRun(
              () =>
                catalogService.admin.updateVariant(product.id, variant.id, {
                  status: e.target.value,
                }),
              "Variant updated",
            )
          }
          className="border-input bg-background h-8 rounded-md border px-2 text-xs"
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </td>

      <td className="px-4 py-2 text-right whitespace-nowrap">
        {dirty && (
          <button
            className={cn("mr-3 underline", saving && "opacity-50")}
            disabled={saving}
            onClick={async () => {
              setSaving(true);

              try {
                await onRun(
                  () =>
                    catalogService.admin.updateVariant(product.id, variant.id, {
                      sku,
                      price,
                      // An empty field clears the compare-at price rather than
                      // sending "" and failing numeric validation.
                      compare_price: compare === "" ? null : compare,
                    }),
                  "Variant updated",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            Save
          </button>
        )}

        {canDelete && (
          <button
            className="text-destructive underline"
            onClick={() =>
              onRun(
                () => catalogService.admin.deleteVariant(product.id, variant.id),
                "Variant deleted",
              )
            }
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

function MatrixGenerator({ product, onRun }: { product: Product; onRun: Runner }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<number, number[]>>({});
  const [price, setPrice] = useState(product.variants?.[0]?.price ?? "0.00");
  const [prefix, setPrefix] = useState(product.sku);
  const [saving, setSaving] = useState(false);

  // Only variant-defining attributes: Material and Care describe a product
  // without multiplying it into more SKUs.
  const { data } = useSWR(open ? "/admin/attributes?variant" : null, () =>
    catalogService.admin.attributes(true),
  );

  const total = Object.values(picked)
    .filter((v) => v.length > 0)
    .reduce((acc, v) => acc * v.length, 1);

  if (!open) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Generate variants</CardTitle>
          <CardDescription>
            Pick the options this product comes in and every combination is created at once.
          </CardDescription>
        </div>
        <Button onClick={() => setOpen(true)}>Open generator</Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <CardTitle>Generate variants</CardTitle>

      {data?.items.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No variant attributes defined yet. Create some under Attributes first.
        </p>
      )}

      {data?.items.map((attribute) => (
        <div key={attribute.id}>
          <p className="mb-2 text-sm font-medium">{attribute.name}</p>
          <div className="flex flex-wrap gap-2">
            {attribute.values?.map((value) => {
              const on = picked[attribute.id]?.includes(value.id) ?? false;

              return (
                <button
                  key={value.id}
                  onClick={() =>
                    setPicked((current) => {
                      const existing = current[attribute.id] ?? [];

                      return {
                        ...current,
                        [attribute.id]: on
                          ? existing.filter((id) => id !== value.id)
                          : [...existing, value.id],
                      };
                    })
                  }
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    on && "border-primary bg-accent font-medium",
                  )}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        <Field
          label="Price for new variants"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
        />
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-muted-foreground text-sm">
          {total > 1 ? `${total} combination(s)` : "Pick at least one option"}
          {" · existing combinations are skipped"}
        </p>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            loading={saving}
            disabled={total <= 1}
            onClick={async () => {
              setSaving(true);

              try {
                const ok = await onRun(
                  () =>
                    catalogService.admin.generateVariants(product.id, {
                      attributes: Object.fromEntries(
                        Object.entries(picked).filter(([, v]) => v.length > 0),
                      ) as Record<number, number[]>,
                      sku_prefix: prefix,
                      price,
                    }),
                  "Variants generated",
                );

                if (ok) {
                  setOpen(false);
                  setPicked({});
                }
              } finally {
                setSaving(false);
              }
            }}
          >
            Generate
          </Button>
        </div>
      </div>
    </Card>
  );
}
