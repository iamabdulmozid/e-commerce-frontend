"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PriceRange } from "@/components/catalog/price";
import { catalogService } from "@/services/catalog";
import { can } from "@/types/auth";

const STATUSES = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useSWR(
    ["/admin/products", status, search],
    async () =>
      (await catalogService.admin.products({ status, q: search, per_page: 50 })).items,
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">
            Everything in the catalog, including drafts.
          </p>
        </div>

        {can(user, "product.create") && (
          <Link href="/admin/products/new">
            <Button>New product</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
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

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or SKU"
          className="border-input bg-background ml-auto h-9 w-64 rounded-md border px-3 text-sm"
        />
      </div>

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.message : "Failed to load products"}
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Brand</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-6">
                  Loading…
                </td>
              </tr>
            )}

            {data?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-6">
                  No products yet.
                </td>
              </tr>
            )}

            {data?.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.primary_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.primary_image.thumb_url}
                        alt=""
                        className="size-10 rounded object-cover"
                      />
                    ) : (
                      <div className="bg-muted size-10 rounded" />
                    )}
                    <div>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium underline"
                      >
                        {product.name}
                      </Link>
                      <p className="text-muted-foreground font-mono text-xs">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground px-4 py-3">
                  {product.brand?.name ?? "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PriceRange range={product.price_range} />
                </td>
                <td className="text-muted-foreground px-4 py-3">{product.product_type}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={product.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : status === "draft"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-muted text-muted-foreground";

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>
  );
}
