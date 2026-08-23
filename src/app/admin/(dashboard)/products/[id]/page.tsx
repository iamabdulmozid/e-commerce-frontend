"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { ProductImagesTab } from "@/components/catalog/product-images-tab";
import { ProductInfoTab } from "@/components/catalog/product-info-tab";
import { ProductVariantsTab } from "@/components/catalog/product-variants-tab";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { catalogService } from "@/services/catalog";

type Tab = "info" | "variants" | "images";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "info", label: "Info" },
  { id: "variants", label: "Variants" },
  { id: "images", label: "Images" },
];

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [tab, setTab] = useState<Tab>("info");
  const [notice, setNotice] = useState<{ tone: "error" | "success"; message: string } | null>(
    null,
  );

  const { data: product, mutate, isLoading } = useSWR(
    `/admin/products/${id}`,
    () => catalogService.admin.product(id),
    { shouldRetryOnError: false },
  );

  /** Shared runner: every tab reports through the same notice. */
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

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;
  if (!product) return <FormAlert message="Product not found" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-muted-foreground text-sm underline">
            Back to products
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">
            {product.sku} · /{product.slug}
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={async () => {
            const ok = await run(
              () => catalogService.admin.deleteProduct(id),
              "Product deleted",
            );
            if (ok) router.push("/admin/products");
          }}
        >
          Delete
        </Button>
      </div>

      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      <div className="flex gap-1 border-b">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm",
              tab === item.id
                ? "border-primary font-medium"
                : "text-muted-foreground border-transparent",
            )}
          >
            {item.label}
            {item.id === "variants" && ` (${product.variants?.length ?? 0})`}
            {item.id === "images" && ` (${product.images?.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === "info" && <ProductInfoTab product={product} onRun={run} />}
      {tab === "variants" && <ProductVariantsTab product={product} onRun={run} />}
      {tab === "images" && <ProductImagesTab product={product} onRun={run} />}
    </div>
  );
}
