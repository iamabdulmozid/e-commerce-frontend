"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { formatMoney } from "@/components/catalog/price";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { catalogService, type PriceRule } from "@/services/catalog";
import { customerService } from "@/services/customer";

/**
 * Every price rule in the catalog, in one table.
 *
 * The product editor's Pricing tab answers "what is going on with this
 * product". This page answers the other question a merchant has — "what am I
 * discounting right now, and what is about to end" — which is impossible to
 * see product by product.
 */

const STATUSES = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AdminPriceRulesPage() {
  const [status, setStatus] = useState("");
  const [groupId, setGroupId] = useState("");

  const { data, isLoading, error } = useSWR(
    ["/admin/price-rules", status, groupId],
    async () =>
      (
        await catalogService.admin.priceRules({
          status,
          customer_group_id: groupId ? Number(groupId) : undefined,
          per_page: 100,
        })
      ).items,
    { shouldRetryOnError: false },
  );

  const { data: groups } = useSWR("/admin/customer-groups", async () =>
    (await customerService.groups()).items,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Price rules</h1>
        <p className="text-muted-foreground text-sm">
          The cheapest applicable rule wins, so a shopper never pays more than a price
          they can see. Rules are created from a product&rsquo;s Pricing tab.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatus(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              status === option.value ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}

        <select
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          aria-label="Customer group"
          className="border-input bg-background ml-auto h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Every audience</option>
          {groups?.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.displayMessage : "Failed to load rules"}
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Rule</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Audience</th>
              <th className="px-4 py-3 font-medium">Runs</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  Loading…
                </td>
              </tr>
            )}

            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  No price rules yet.
                </td>
              </tr>
            )}

            {data?.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-3">{rule.name ?? <span className="text-muted-foreground">Untitled</span>}</td>

                <td className="px-4 py-3">
                  {rule.variant ? (
                    <Link
                      href={`/admin/products/${rule.variant.product_id}`}
                      className="font-mono text-xs underline"
                    >
                      {rule.variant.sku}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                  {formatMoney(rule.amount)}
                  {rule.variant && (
                    <span className="text-muted-foreground ml-2 text-xs line-through">
                      {formatMoney(rule.variant.price)}
                    </span>
                  )}
                </td>

                <td className="text-muted-foreground px-4 py-3">
                  {rule.customer_group?.name ?? "Everyone"}
                  {rule.min_quantity > 1 && ` · ${rule.min_quantity}+`}
                </td>

                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                  {describeWindow(rule)}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      rule.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {rule.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/**
 * Status says whether the merchant switched the rule on; this says whether it
 * is actually running today. A rule can be active and still not apply.
 */
function describeWindow(rule: PriceRule): string {
  const date = (value: string) => new Date(value).toLocaleDateString();
  const now = Date.now();

  if (rule.starts_at && new Date(rule.starts_at).getTime() > now) {
    return `from ${date(rule.starts_at)}`;
  }

  if (rule.ends_at && new Date(rule.ends_at).getTime() < now) {
    return `ended ${date(rule.ends_at)}`;
  }

  return rule.ends_at ? `until ${date(rule.ends_at)}` : "ongoing";
}
