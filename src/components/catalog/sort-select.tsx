"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import {
  buildListingHref,
  DEFAULT_SORT,
  SORTS,
  toSearchParams,
  type ListingParams,
} from "@/lib/catalog-query";

/**
 * The sort control.
 *
 * A real <form method="get"> around a native <select>, so it still works with
 * JavaScript disabled — the shopper picks an order and tabs to the Apply
 * button, which is visually hidden until it has focus. With JavaScript, the
 * change event navigates immediately and the button is never needed.
 *
 * A native <select> also means the platform picker on a phone, correct screen
 * reader semantics and keyboard behaviour, none of which a hand-rolled listbox
 * gets for free.
 */
export function SortSelect({
  active,
  basePath,
}: {
  active: ListingParams;
  basePath: string;
}) {
  const router = useRouter();

  // Everything except sort and page travels as hidden inputs, so changing the
  // order keeps the filters already applied.
  const carried = toSearchParams({
    ...active,
    sort: undefined,
    page: undefined,
  });

  return (
    <form
      action={basePath}
      method="get"
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("sort");
        router.push(buildListingHref(basePath, active, { sort: String(value) }));
      }}
    >
      {[...carried.entries()].map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <label htmlFor="sort" className="text-muted-foreground shrink-0 text-sm">
        Sort
      </label>

      <Select
        id="sort"
        name="sort"
        defaultValue={active.sort ?? DEFAULT_SORT}
        onChange={(event) =>
          router.push(
            buildListingHref(basePath, active, { sort: event.target.value }),
          )
        }
        className="h-10 w-auto min-w-44"
      >
        {SORTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <button
        type="submit"
        className="bg-primary text-primary-foreground sr-only rounded-lg px-3 py-2 text-sm focus:not-sr-only"
      >
        Apply sort
      </button>
    </form>
  );
}
