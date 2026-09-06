"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Store search.
 *
 * It submits to /products?q=… rather than a /search page: `q` is a filter the
 * catalog listing already supports, and a real search page belongs to Phase 20
 * where SearchService lands (PRD 5A, D2). Building it now would mean building
 * it twice.
 *
 * A real <form method="get"> underneath, so it still works with JavaScript
 * off. The router push is an enhancement over that, not a replacement for it.
 */
export function SearchForm({
  className,
  autoFocus = false,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  return (
    <form
      action="/products"
      method="get"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const term = value.trim();
        router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
        onSubmitted?.();
      }}
      className={cn("relative w-full", className)}
    >
      <label htmlFor="store-search" className="sr-only">
        Search products
      </label>

      <Search
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />

      <input
        id="store-search"
        name="q"
        type="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products…"
        className="border-input bg-muted/60 hover:bg-muted focus-visible:border-primary focus-visible:bg-card h-11 w-full rounded-full border pr-4 pl-10 text-sm transition-colors"
      />
    </form>
  );
}
