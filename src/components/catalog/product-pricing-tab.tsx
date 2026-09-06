"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatMoney } from "@/components/catalog/price";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  catalogService,
  type PriceRule,
  type PriceRulePayload,
  type Product,
} from "@/services/catalog";
import { customerService } from "@/services/customer";

type Runner = (action: () => Promise<unknown>, success: string) => Promise<boolean>;

/**
 * Price rules for one product's variants, plus the preview.
 *
 * The preview is the part that earns its keep. A merchant looking at three
 * overlapping rules cannot be expected to run the comparator in their head, so
 * the screen answers "what would a Wholesale customer buying twelve pay, and
 * which rule decided that?" directly.
 */
export function ProductPricingTab({ product, onRun }: { product: Product; onRun: Runner }) {
  const [editing, setEditing] = useState<PriceRule | { variant_id: number } | null>(null);

  const { data, mutate } = useSWR(
    `/admin/products/${product.id}/price-rules`,
    async () => (await catalogService.admin.productPriceRules(product.id)).items,
    { shouldRetryOnError: false },
  );

  const { data: groups } = useSWR("/admin/customer-groups", async () =>
    (await customerService.groups()).items,
  );

  const rules = data ?? [];
  const variants = product.variants ?? [];

  async function run(action: () => Promise<unknown>, success: string) {
    const ok = await onRun(action, success);
    if (ok) await mutate();

    return ok;
  }

  return (
    <div className="space-y-5">
      <PricePreview product={product} groups={groups ?? []} />

      {variants.map((variant) => {
        const own = rules.filter((rule) => rule.variant_id === variant.id);

        return (
          <Card key={variant.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">
                  {variant.attributes.map((a) => a.value).join(" / ") || "Default"}
                </CardTitle>
                <CardDescription>
                  {variant.sku} · base {formatMoney(variant.price)}
                </CardDescription>
              </div>

              <Button
                variant="secondary"
                onClick={() => setEditing({ variant_id: variant.id })}
              >
                Add rule
              </Button>
            </div>

            {own.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No rules — this variant sells at its base price.
              </p>
            ) : (
              <ul className="divide-y text-sm">
                {own.map((rule) => (
                  <li key={rule.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="font-medium tabular-nums">{formatMoney(rule.amount)}</span>

                    <span className="text-muted-foreground">
                      {rule.customer_group?.name ?? "Everyone"}
                      {rule.min_quantity > 1 && ` · ${rule.min_quantity}+`}
                      {(rule.starts_at || rule.ends_at) &&
                        ` · ${windowLabel(rule.starts_at, rule.ends_at)}`}
                    </span>

                    {rule.name && (
                      <span className="bg-muted rounded px-2 py-0.5 text-xs">{rule.name}</span>
                    )}

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        rule.status === "active"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {rule.status}
                    </span>

                    <span className="ml-auto whitespace-nowrap">
                      <button onClick={() => setEditing(rule)} className="mr-3 underline">
                        Edit
                      </button>
                      <button
                        className="text-destructive underline"
                        onClick={() =>
                          run(() => catalogService.admin.deletePriceRule(rule.id), "Rule deleted")
                        }
                      >
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      {editing && (
        <RuleForm
          // Remounting resets the uncontrolled fields when the target changes.
          key={"id" in editing ? editing.id : `new-${editing.variant_id}`}
          rule={"id" in editing ? editing : null}
          variantId={editing.variant_id}
          groups={groups ?? []}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
          onRun={run}
        />
      )}
    </div>
  );
}

function RuleForm({
  rule,
  variantId,
  groups,
  onCancel,
  onSaved,
  onRun,
}: {
  rule: PriceRule | null;
  variantId: number;
  groups: Array<{ id: number; name: string }>;
  onCancel: () => void;
  onSaved: () => void;
  onRun: Runner;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Card className="space-y-4">
      <CardTitle>{rule ? "Edit rule" : "New price rule"}</CardTitle>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSaving(true);

          const payload: PriceRulePayload = {
            name: String(form.get("name") || "") || null,
            amount: String(form.get("amount")),
            min_quantity: Number(form.get("min_quantity") || 1),
            customer_group_id: form.get("customer_group_id")
              ? Number(form.get("customer_group_id"))
              : null,
            starts_at: String(form.get("starts_at") || "") || null,
            ends_at: String(form.get("ends_at") || "") || null,
            status: form.get("status") === "inactive" ? "inactive" : "active",
          };

          // The target is fixed on create and refused on update, so it is
          // only ever sent once.
          if (!rule) payload.variant_id = variantId;

          try {
            const ok = await onRun(
              () => catalogService.admin.savePriceRule(payload, rule?.id),
              rule ? "Rule updated" : "Rule created",
            );

            if (ok) onSaved();
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Price"
            name="amount"
            defaultValue={rule?.amount ?? ""}
            inputMode="decimal"
            required
          />
          <Field label="Label" name="name" defaultValue={rule?.name ?? ""} placeholder="Eid Sale" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="customer_group_id" className="block text-sm font-medium">
              Applies to
            </label>
            <select
              id="customer_group_id"
              name="customer_group_id"
              defaultValue={rule?.customer_group_id ?? ""}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Everyone, guests included</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} only
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Minimum quantity"
            name="min_quantity"
            type="number"
            min={1}
            defaultValue={rule?.min_quantity ?? 1}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Starts"
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalInput(rule?.starts_at)}
          />
          <Field
            label="Ends"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalInput(rule?.ends_at)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={rule?.status ?? "active"}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button type="submit" loading={saving}>
            {rule ? "Save rule" : "Create rule"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <CardDescription>
        Leave both dates blank for a rule that runs until you switch it off. The cheapest
        applicable rule wins, so a shopper never pays more than a price they can see.
      </CardDescription>
    </Card>
  );
}

function PricePreview({
  product,
  groups,
}: {
  product: Product;
  groups: Array<{ id: number; name: string }>;
}) {
  const [groupId, setGroupId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading } = useSWR(
    ["price-preview", product.id, groupId, quantity],
    async () =>
      (
        await catalogService.admin.previewPrices(product.id, {
          customer_group_id: groupId ? Number(groupId) : null,
          quantity,
        })
      ).variants,
    { shouldRetryOnError: false },
  );

  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>What would this cost?</CardTitle>
        <CardDescription>
          Resolved server-side by the same code the storefront uses.
        </CardDescription>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="preview_group" className="block text-sm font-medium">
            Customer
          </label>
          <select
            id="preview_group"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Guest / no group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Quantity"
          name="preview_quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Base</th>
              <th className="px-3 py-2 font-medium">They pay</th>
              <th className="px-3 py-2 font-medium">Because of</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-3 py-4">
                  Resolving…
                </td>
              </tr>
            )}

            {data?.map((row) => (
              <tr key={row.variant_id}>
                <td className="px-3 py-2 font-mono text-xs">{row.sku}</td>
                <td className="text-muted-foreground px-3 py-2 tabular-nums">
                  {formatMoney(row.base)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 font-medium tabular-nums",
                    row.is_discounted && "text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {formatMoney(row.effective)}
                </td>
                <td className="text-muted-foreground px-3 py-2">
                  {row.rule_id
                    ? (row.rule_name ?? `Rule #${row.rule_id}`)
                    : "Base price — no rule applies"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function windowLabel(from: string | null, to: string | null): string {
  const date = (value: string) => new Date(value).toLocaleDateString();

  if (from && to) return `${date(from)} – ${date(to)}`;
  if (from) return `from ${date(from)}`;
  if (to) return `until ${date(to)}`;

  return "always";
}

/** `datetime-local` wants `YYYY-MM-DDTHH:mm`, not an ISO string with a zone. */
function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";

  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
