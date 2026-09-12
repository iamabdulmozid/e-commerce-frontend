"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
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
 * off. The router push is an enhancement over that, not a replacement for it —
 * and the submit button means the no-JS path no longer depends on the shopper
 * guessing that Enter will work.
 *
 * The field is a pill with the button inside it rather than a bare input:
 * that is the shape shoppers have been trained on by every large storefront,
 * and it gives the control an obvious action instead of leaving it looking
 * like a stray text box in the header.
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

  // The header renders this three times — the desktop row, the mobile row and
  // the nav drawer — and the hidden ones are still in the DOM. A literal id
  // would put three of the same on the page and point every label at the
  // first, which is exactly the bug that makes a label useless.
  const inputId = useId();

  return (
    <form
      action="/products"
      method="get"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const term = value.trim();
        router.push(
          term ? `/products?q=${encodeURIComponent(term)}` : "/products",
        );
        onSubmitted?.();
      }}
      className={cn("w-full", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>

      {/*
        The ring lives on the wrapper, not the input: focus should outline the
        whole control the shopper perceives, button included, rather than draw
        a second box inside the pill.
      */}
      <div
        className={cn(
          "border-input bg-muted flex h-11 items-center rounded-full border pl-3.5",
          "focus-within:border-primary focus-within:ring-ring/35 transition-colors focus-within:ring-2",
        )}
      >
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none size-4 shrink-0"
        />

        <input
          id={inputId}
          name="q"
          type="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search products…"
          className={cn(
            "placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none",
            // Chrome and Edge draw their own grey clear "×" inside a
            // type=search field. It ignores the surrounding design, sits hard
            // against the submit button, and appears and vanishes as you type.
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />

        <button
          type="submit"
          className={cn(
            "bg-primary text-primary-foreground hover:bg-primary-hover mr-1 inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium",
            "transition-colors duration-[--duration-fast]",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          )}
        >
          Search
        </button>
      </div>
    </form>
  );
}
