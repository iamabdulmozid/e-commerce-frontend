"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { catalogService } from "@/services/catalog";

/**
 * Create a product.
 *
 * Deliberately minimal: name, SKU, price and where it belongs. Variants,
 * images and SEO are the editor's job, and asking for all of it up front
 * would make the first step feel like paperwork.
 *
 * The price here seeds the default variant the API creates - every product has
 * at least one, so a simple product is sellable the moment it is published.
 */
export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: brands } = useSWR("/admin/brands", () => catalogService.admin.brands());
  const { data: categories } = useSWR("/admin/categories", () =>
    catalogService.admin.categories(),
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const form = new FormData(event.currentTarget);

    try {
      const product = await catalogService.admin.createProduct({
        name: String(form.get("name")),
        sku: String(form.get("sku")),
        price: String(form.get("price")),
        brand_id: form.get("brand_id") ? Number(form.get("brand_id")) : null,
        category_ids: form.getAll("category_ids").map(Number),
        short_description: String(form.get("short_description") || ""),
        status: String(form.get("status")),
      });

      router.push(`/admin/products/${product.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError("Something went wrong", 0));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-muted-foreground text-sm underline">
          Back to products
        </Link>
        <h1 className="mt-1 text-2xl font-bold">New product</h1>
      </div>

      {error && (
        <FormAlert
          message={
            error.fieldError("sku") ??
            error.fieldError("price") ??
            error.fieldError("name") ??
            // A plan-limit refusal names the ceiling rather than saying
            // "Forbidden".
            error.displayMessage
          }
        />
      )}

      <Card className="space-y-5">
        <div className="space-y-1">
          <CardTitle>Basics</CardTitle>
          <CardDescription>
            You can add variants, images and SEO after it exists.
          </CardDescription>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Name" name="name" required error={error?.fieldError("name")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="SKU"
              name="sku"
              required
              error={error?.fieldError("sku")}
              placeholder="KURTA-001"
            />
            <Field
              label="Price"
              name="price"
              required
              inputMode="decimal"
              defaultValue="0.00"
              error={error?.fieldError("price")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="brand_id" className="block text-sm font-medium">
              Brand
            </label>
            <select
              id="brand_id"
              name="brand_id"
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
                  <input type="checkbox" name="category_ids" value={category.id} />
                  {category.name}
                </label>
              ))}
              {categories?.items.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No categories yet.{" "}
                  <Link href="/admin/categories" className="underline">
                    Create one
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

          <Field label="Short description" name="short_description" />

          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="draft"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <Button type="submit" loading={saving}>
            Create product
          </Button>
        </form>
      </Card>
    </div>
  );
}
