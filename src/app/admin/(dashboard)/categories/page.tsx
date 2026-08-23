"use client";

import { useState } from "react";
import useSWR from "swr";
import { MediaPicker } from "@/components/catalog/media-picker";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  catalogService,
  type Category,
  type CategoryPayload,
  type Media,
} from "@/services/catalog";
import { can } from "@/types/auth";

/**
 * The category tree.
 *
 * The API returns a flat list already ordered by depth then sort_order, so the
 * nesting is drawn from the `depth` column rather than rebuilt client-side -
 * the server owns the tree's shape and this screen only renders it.
 *
 * Reordering moves a category among its own siblings and submits the whole
 * level in one call, because two categories briefly sharing position 3 is a
 * state the operator should never be able to observe.
 */
export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [notice, setNotice] = useState<
    { tone: "error" | "success"; message: string } | null
  >(null);

  const { data, isLoading, mutate } = useSWR(
    "/admin/categories",
    async () => (await catalogService.admin.categories()).items,
    { shouldRetryOnError: false },
  );

  const categories = data ?? [];

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

  /** Siblings share a parent; a move only ever renumbers that one level. */
  function move(category: Category, direction: -1 | 1) {
    const siblings = categories.filter((c) => c.parent_id === category.parent_id);
    const index = siblings.findIndex((c) => c.id === category.id);
    const target = index + direction;

    if (target < 0 || target >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    void run(
      () =>
        catalogService.admin.reorderCategories(
          reordered.map((c, position) => ({ id: c.id, sort_order: position })),
        ),
      "Order updated",
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Up to three levels deep. A category with children or products cannot be
            deleted.
          </p>
        </div>

        {can(user, "category.create") && (
          <Button onClick={() => setEditing("new")}>New category</Button>
        )}
      </div>

      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      {editing && (
        <CategoryForm
          category={editing === "new" ? null : editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
          onRun={run}
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
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

            {!isLoading && categories.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-6">
                  No categories yet.
                </td>
              </tr>
            )}

            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-2">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${category.depth * 20}px` }}
                  >
                    {category.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.image.thumb_url}
                        alt=""
                        className="size-8 rounded object-cover"
                      />
                    ) : (
                      <div className="bg-muted size-8 rounded" />
                    )}
                    <span className={cn(category.depth === 0 && "font-medium")}>
                      {category.name}
                    </span>
                  </div>
                </td>
                <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                  {category.slug}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      category.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {category.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => move(category, -1)}
                    className="text-muted-foreground mr-2 underline"
                    aria-label={`Move ${category.name} up`}
                  >
                    Up
                  </button>
                  <button
                    onClick={() => move(category, 1)}
                    className="text-muted-foreground mr-3 underline"
                    aria-label={`Move ${category.name} down`}
                  >
                    Down
                  </button>

                  {can(user, "category.update") && (
                    <button
                      onClick={() => setEditing(category)}
                      className="mr-3 underline"
                    >
                      Edit
                    </button>
                  )}

                  {can(user, "category.delete") && (
                    <button
                      className="text-destructive underline"
                      onClick={() =>
                        run(
                          () => catalogService.admin.deleteCategory(category.id),
                          "Category deleted",
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

function CategoryForm({
  category,
  categories,
  onCancel,
  onSaved,
  onRun,
}: {
  category: Category | null;
  categories: Category[];
  onCancel: () => void;
  onSaved: () => void;
  onRun: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
}) {
  const [image, setImage] = useState<{ id: number; thumb_url: string } | null>(
    category?.image ? { id: category.image.id, thumb_url: category.image.thumb_url } : null,
  );
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  // Depth 2 is the last level that can hold children, and a category can never
  // be re-parented under itself or its own subtree.
  const descendants = category ? descendantIds(categories, category.id) : new Set<number>();
  const parents = categories.filter(
    (c) => c.depth < 2 && c.id !== category?.id && !descendants.has(c.id),
  );

  return (
    <Card className="space-y-4">
      <CardTitle>{category ? `Edit ${category.name}` : "New category"}</CardTitle>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSaving(true);

          const payload: CategoryPayload = {
            name: String(form.get("name")),
            slug: String(form.get("slug") || "") || null,
            parent_id: form.get("parent_id") ? Number(form.get("parent_id")) : null,
            description: String(form.get("description") || "") || null,
            image_id: image?.id ?? null,
            status: form.get("status") === "inactive" ? "inactive" : "active",
            seo_title: String(form.get("seo_title") || "") || null,
            seo_description: String(form.get("seo_description") || "") || null,
          };

          try {
            const ok = await onRun(
              () =>
                category
                  ? catalogService.admin.updateCategory(category.id, payload)
                  : catalogService.admin.createCategory(payload),
              category ? "Category updated" : "Category created",
            );

            if (ok) onSaved();
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" defaultValue={category?.name ?? ""} required />
          <Field
            label="Slug"
            name="slug"
            defaultValue={category?.slug ?? ""}
            placeholder="Left blank, derived from the name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="parent_id" className="block text-sm font-medium">
              Parent
            </label>
            <select
              id="parent_id"
              name="parent_id"
              defaultValue={category?.parent_id ?? ""}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Top level</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {"— ".repeat(parent.depth)}
                  {parent.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={category?.status ?? "active"}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={category?.description ?? ""}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium">Image</span>
          <div className="flex items-center gap-3">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.thumb_url} alt="" className="size-16 rounded object-cover" />
            ) : (
              <div className="bg-muted size-16 rounded" />
            )}
            <Button type="button" variant="secondary" onClick={() => setPicking(true)}>
              Choose
            </Button>
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-destructive text-sm underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="SEO title"
            name="seo_title"
            defaultValue={category?.seo_title ?? ""}
          />
          <Field
            label="SEO description"
            name="seo_description"
            defaultValue={category?.seo_description ?? ""}
          />
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button type="submit" loading={saving}>
            {category ? "Save changes" : "Create category"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <CardDescription>
        Moving a category takes its children with it; the server rejects a move that
        would push the tree past three levels.
      </CardDescription>

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        onSelect={(media: Media[]) => {
          const [first] = media;
          if (first) setImage({ id: first.id, thumb_url: first.thumb_url });
        }}
      />
    </Card>
  );
}

/** Every category beneath `rootId`, so it cannot be offered as its own parent. */
function descendantIds(categories: Category[], rootId: number): Set<number> {
  const found = new Set<number>([rootId]);

  // The list is ordered by depth, so one pass reaches every level.
  for (const category of categories) {
    if (category.parent_id !== null && found.has(category.parent_id)) {
      found.add(category.id);
    }
  }

  found.delete(rootId);

  return found;
}
