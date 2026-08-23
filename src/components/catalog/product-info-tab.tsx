"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { catalogService, type Product } from "@/services/catalog";

type Runner = (action: () => Promise<unknown>, success: string) => Promise<boolean>;

export function ProductInfoTab({ product, onRun }: { product: Product; onRun: Runner }) {
  const [saving, setSaving] = useState(false);

  const { data: brands } = useSWR("/admin/brands", () => catalogService.admin.brands());
  const { data: categories } = useSWR("/admin/categories", () =>
    catalogService.admin.categories(),
  );

  const selected = new Set((product.categories ?? []).map((c) => c.id));

  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSaving(true);

        try {
          await onRun(
            () =>
              catalogService.admin.updateProduct(product.id, {
                name: String(form.get("name")),
                sku: String(form.get("sku")),
                brand_id: form.get("brand_id") ? Number(form.get("brand_id")) : null,
                category_ids: form.getAll("category_ids").map(Number),
                short_description: String(form.get("short_description") || ""),
                description: String(form.get("description") || ""),
                status: String(form.get("status")),
                is_featured: form.get("is_featured") === "on",
                is_new_arrival: form.get("is_new_arrival") === "on",
                is_bestseller: form.get("is_bestseller") === "on",
                seo_title: String(form.get("seo_title") || ""),
                seo_description: String(form.get("seo_description") || ""),
              }),
            "Product saved",
          );
        } finally {
          setSaving(false);
        }
      }}
    >
      <Card className="space-y-4">
        <CardTitle>Details</CardTitle>

        <Field label="Name" name="name" defaultValue={product.name} required />
        <Field label="SKU" name="sku" defaultValue={product.sku} required />

        <div className="space-y-1.5">
          <label htmlFor="brand_id" className="block text-sm font-medium">
            Brand
          </label>
          <select
            id="brand_id"
            name="brand_id"
            defaultValue={product.brand?.id ?? ""}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">No brand</option>
            {brands?.items.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Categories</label>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-3">
            {categories?.items.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 text-sm"
                style={{ paddingLeft: `${category.depth * 14}px` }}
              >
                <input
                  type="checkbox"
                  name="category_ids"
                  value={category.id}
                  defaultChecked={selected.has(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        <Field
          label="Short description"
          name="short_description"
          defaultValue={product.short_description ?? ""}
        />

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={product.description ?? ""}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle>Visibility</CardTitle>

        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={product.status}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <p className="text-muted-foreground text-xs">
            A published product still needs at least one active variant before shoppers can
            see it.
          </p>
        </div>

        <div className="space-y-2">
          {[
            ["is_featured", "Featured", product.is_featured],
            ["is_new_arrival", "New arrival", product.is_new_arrival],
            ["is_bestseller", "Bestseller", product.is_bestseller],
          ].map(([name, label, checked]) => (
            <label key={String(name)} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} />
              {String(label)}
            </label>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle>SEO</CardTitle>
        <Field label="SEO title" name="seo_title" defaultValue={product.seo_title ?? ""} />
        <Field
          label="SEO description"
          name="seo_description"
          defaultValue={product.seo_description ?? ""}
        />
      </Card>

      <Button type="submit" loading={saving}>
        Save changes
      </Button>
    </form>
  );
}
