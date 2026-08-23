"use client";

import { useState } from "react";
import useSWR from "swr";
import { MediaPicker } from "@/components/catalog/media-picker";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  catalogService,
  type Brand,
  type BrandPayload,
  type Media,
} from "@/services/catalog";
import { can } from "@/types/auth";

/**
 * Brands: a flat list, so this stays a table with an inline editor rather than
 * the separate detail page products need.
 */
export default function AdminBrandsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [notice, setNotice] = useState<
    { tone: "error" | "success"; message: string } | null
  >(null);

  const { data, isLoading, mutate } = useSWR(
    ["/admin/brands", search],
    async () => (await catalogService.admin.brands({ q: search, per_page: 100 })).items,
    { shouldRetryOnError: false },
  );

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice(null);

    try {
      await action();
      await mutate();
      setNotice({ tone: "success", message: success });

      return true;
    } catch (e) {
      setNotice({
        tone: "error",
        message: e instanceof ApiError ? e.displayMessage : "Something went wrong",
      });

      return false;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-muted-foreground text-sm">
            A brand still in use by a product cannot be deleted.
          </p>
        </div>

        {can(user, "brand.create") && (
          <Button onClick={() => setEditing("new")}>New brand</Button>
        )}
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search brands"
        className="border-input bg-background h-9 w-64 rounded-md border px-3 text-sm"
      />

      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      {editing && (
        <BrandForm
          brand={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
          onRun={run}
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-6">
                  Loading…
                </td>
              </tr>
            )}

            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-6">
                  No brands yet.
                </td>
              </tr>
            )}

            {data?.map((brand) => (
              <tr key={brand.id}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    {brand.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={brand.logo.thumb_url}
                        alt=""
                        className="size-9 rounded object-contain"
                      />
                    ) : (
                      <div className="bg-muted size-9 rounded" />
                    )}
                    <span className="font-medium">{brand.name}</span>
                  </div>
                </td>
                <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                  {brand.slug}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      brand.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {brand.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {can(user, "brand.update") && (
                    <button onClick={() => setEditing(brand)} className="mr-3 underline">
                      Edit
                    </button>
                  )}

                  {can(user, "brand.delete") && (
                    <button
                      className="text-destructive underline"
                      onClick={() =>
                        run(
                          () => catalogService.admin.deleteBrand(brand.id),
                          "Brand deleted",
                        )
                      }
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function BrandForm({
  brand,
  onCancel,
  onSaved,
  onRun,
}: {
  brand: Brand | null;
  onCancel: () => void;
  onSaved: () => void;
  onRun: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
}) {
  const [logo, setLogo] = useState<{ id: number; thumb_url: string } | null>(
    brand?.logo ? { id: brand.logo.id, thumb_url: brand.logo.thumb_url } : null,
  );
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Card className="space-y-4">
      <CardTitle>{brand ? `Edit ${brand.name}` : "New brand"}</CardTitle>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSaving(true);

          const payload: BrandPayload = {
            name: String(form.get("name")),
            slug: String(form.get("slug") || "") || null,
            description: String(form.get("description") || "") || null,
            logo_id: logo?.id ?? null,
            status: form.get("status") === "inactive" ? "inactive" : "active",
            seo_title: String(form.get("seo_title") || "") || null,
            seo_description: String(form.get("seo_description") || "") || null,
          };

          try {
            const ok = await onRun(
              () =>
                brand
                  ? catalogService.admin.updateBrand(brand.id, payload)
                  : catalogService.admin.createBrand(payload),
              brand ? "Brand updated" : "Brand created",
            );

            if (ok) onSaved();
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" defaultValue={brand?.name ?? ""} required />
          <Field
            label="Slug"
            name="slug"
            defaultValue={brand?.slug ?? ""}
            placeholder="Left blank, derived from the name"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={brand?.description ?? ""}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="block text-sm font-medium">Logo</span>
            <div className="flex items-center gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.thumb_url} alt="" className="size-16 rounded object-contain" />
              ) : (
                <div className="bg-muted size-16 rounded" />
              )}
              <Button type="button" variant="secondary" onClick={() => setPicking(true)}>
                Choose
              </Button>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="text-destructive text-sm underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={brand?.status ?? "active"}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO title" name="seo_title" defaultValue={brand?.seo_title ?? ""} />
          <Field
            label="SEO description"
            name="seo_description"
            defaultValue={brand?.seo_description ?? ""}
          />
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button type="submit" loading={saving}>
            {brand ? "Save changes" : "Create brand"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        onSelect={(media: Media[]) => {
          const [first] = media;
          if (first) setLogo({ id: first.id, thumb_url: first.thumb_url });
        }}
      />
    </Card>
  );
}
