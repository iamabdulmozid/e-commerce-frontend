"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  catalogService,
  type Attribute,
  type AttributePayload,
  type AttributeValuePayload,
} from "@/services/catalog";
import { can } from "@/types/auth";

/**
 * Attributes and their values.
 *
 * Two kinds live here and the difference matters: a *variant* attribute
 * (Colour, Size) multiplies a product into SKUs, while a descriptive one
 * (Material, Care) only describes it. The variant generator refuses the
 * descriptive kind, so the flag is the first thing this screen shows.
 */
export default function AdminAttributesPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState<Attribute | "new" | null>(null);
  const [notice, setNotice] = useState<
    { tone: "error" | "success"; message: string } | null
  >(null);

  const { data, isLoading, mutate } = useSWR(
    "/admin/attributes",
    async () => (await catalogService.admin.attributes()).items,
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
          <h1 className="text-2xl font-bold">Attributes</h1>
          <p className="text-muted-foreground text-sm">
            Variant attributes define SKUs. Descriptive ones only describe a product.
          </p>
        </div>

        {can(user, "product.create") && (
          <Button onClick={() => setEditing("new")}>New attribute</Button>
        )}
      </div>

      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      {editing && (
        <AttributeForm
          // Remounting on a different attribute resets the value rows, which
          // are local state rather than derived from props.
          key={editing === "new" ? "new" : editing.id}
          attribute={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
          onRun={run}
        />
      )}

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {!isLoading && data?.length === 0 && (
        <Card className="text-muted-foreground text-sm">No attributes yet.</Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((attribute) => (
          <Card key={attribute.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">
                  {attribute.name}
                  {attribute.is_variant && (
                    <span className="bg-primary/10 text-primary ml-2 rounded-full px-2 py-0.5 text-xs font-medium">
                      variant
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {attribute.type} · {attribute.values?.length ?? 0} values
                </CardDescription>
              </div>

              <div className="whitespace-nowrap">
                {can(user, "product.update") && (
                  <button
                    onClick={() => setEditing(attribute)}
                    className="mr-3 text-sm underline"
                  >
                    Edit
                  </button>
                )}
                {can(user, "product.delete") && (
                  <button
                    className="text-destructive text-sm underline"
                    onClick={() =>
                      run(
                        () => catalogService.admin.deleteAttribute(attribute.id),
                        "Attribute deleted",
                      )
                    }
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {attribute.values?.map((value) => (
                <span
                  key={value.id}
                  className="bg-muted flex items-center gap-1.5 rounded px-2 py-0.5 text-xs"
                >
                  {value.color_hex && (
                    <span
                      className="size-3 rounded-full border"
                      style={{ backgroundColor: value.color_hex }}
                    />
                  )}
                  {value.value}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** A row in the editor; `id` is absent until the server has saved it. */
interface ValueRow extends AttributeValuePayload {
  key: string;
}

function AttributeForm({
  attribute,
  onCancel,
  onSaved,
  onRun,
}: {
  attribute: Attribute | null;
  onCancel: () => void;
  onSaved: () => void;
  onRun: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
}) {
  const [type, setType] = useState<Attribute["type"]>(attribute?.type ?? "select");
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ValueRow[]>(() =>
    (attribute?.values ?? []).map((value) => ({
      key: `existing-${value.id}`,
      id: value.id,
      value: value.value,
      color_hex: value.color_hex,
    })),
  );

  // A text attribute is free-form on the product, so it carries no value list.
  const takesValues = type !== "text";

  function patch(key: string, changes: Partial<ValueRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  }

  return (
    <Card className="space-y-4">
      <CardTitle>{attribute ? `Edit ${attribute.name}` : "New attribute"}</CardTitle>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSaving(true);

          const payload: AttributePayload = {
            name: String(form.get("name")),
            slug: String(form.get("slug") || "") || null,
            type,
            is_variant: form.get("is_variant") === "on",
            values: takesValues
              ? rows
                  .filter((row) => row.value.trim() !== "")
                  .map((row, index) => ({
                    id: row.id,
                    value: row.value.trim(),
                    color_hex: type === "color" ? (row.color_hex ?? null) : null,
                    sort_order: index,
                  }))
              : [],
          };

          try {
            const ok = await onRun(
              () => catalogService.admin.saveAttribute(payload, attribute?.id),
              attribute ? "Attribute updated" : "Attribute created",
            );

            if (ok) onSaved();
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" defaultValue={attribute?.name ?? ""} required />
          <Field
            label="Slug"
            name="slug"
            defaultValue={attribute?.slug ?? ""}
            placeholder="Left blank, derived from the name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="type" className="block text-sm font-medium">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value as Attribute["type"])}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="select">Select — a list of options</option>
              <option value="color">Colour — options with a swatch</option>
              <option value="text">Text — free-form on the product</option>
            </select>
          </div>

          <label className="flex items-end gap-2 pb-2.5 text-sm">
            <input
              type="checkbox"
              name="is_variant"
              defaultChecked={attribute?.is_variant ?? true}
              className="size-4"
            />
            Defines variants
          </label>
        </div>

        {takesValues && (
          <div className="space-y-2">
            <span className="block text-sm font-medium">Values</span>

            {rows.length === 0 && (
              <p className="text-muted-foreground text-sm">No values yet.</p>
            )}

            <ul className="space-y-2">
              {rows.map((row) => (
                <li key={row.key} className="flex items-center gap-2">
                  <input
                    value={row.value}
                    onChange={(event) => patch(row.key, { value: event.target.value })}
                    placeholder="Value"
                    className="border-input bg-background h-9 flex-1 rounded-md border px-3 text-sm"
                  />

                  {type === "color" && (
                    <input
                      type="color"
                      value={row.color_hex ?? "#000000"}
                      onChange={(event) => patch(row.key, { color_hex: event.target.value })}
                      className="border-input h-9 w-14 rounded-md border"
                      aria-label={`Colour for ${row.value || "new value"}`}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setRows((current) => current.filter((r) => r.key !== row.key))
                    }
                    className="text-destructive text-sm underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setRows((current) => [
                  ...current,
                  {
                    // A stable key from the position, since a new row has no id
                    // and the value itself changes as it is typed.
                    key: `new-${current.length}-${current.filter((r) => !r.id).length}`,
                    value: "",
                    color_hex: type === "color" ? "#000000" : null,
                  },
                ])
              }
            >
              Add value
            </Button>

            <p className={cn("text-muted-foreground text-xs", type !== "color" && "hidden")}>
              Every colour needs a swatch — the server rejects the attribute otherwise.
            </p>
          </div>
        )}

        <div className="flex gap-2 border-t pt-4">
          <Button type="submit" loading={saving}>
            {attribute ? "Save changes" : "Create attribute"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <CardDescription>
        Removing a value that a variant already uses is refused; retire the variant
        first.
      </CardDescription>
    </Card>
  );
}
