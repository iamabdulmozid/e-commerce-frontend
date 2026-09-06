/**
 * The listing query string, in one place.
 *
 * Three pages render the same listing — /products, a category and a brand —
 * and each of them has to allow-list the query parameters it forwards to the
 * API, build hrefs that preserve the filters a shopper already set, and reset
 * the page when a filter changes. Doing that three times is how they drift.
 *
 * The allow-list is the security-relevant half: passing the query string
 * through verbatim would let anyone probe the API with parameters these pages
 * never intended to expose.
 */

export const LISTING_PARAMS = [
  "category",
  "brand",
  "min_price",
  "max_price",
  "sort",
  "page",
  "q",
  "featured",
  "new",
  "bestseller",
] as const;

export type ListingParam = (typeof LISTING_PARAMS)[number];

export type ListingParams = Partial<Record<ListingParam, string>>;

/** Filters that, when changed, make the current page number meaningless. */
const PAGING_RESET: ListingParam[] = LISTING_PARAMS.filter(
  (key) => key !== "page",
);

export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
] as const;

export const DEFAULT_SORT = "newest";

/** Keep only the parameters a listing understands, as plain strings. */
export function pickListingParams(
  raw: Record<string, string | string[] | undefined>,
): ListingParams {
  const picked: ListingParams = {};

  for (const key of LISTING_PARAMS) {
    const value = raw[key];

    if (typeof value === "string" && value !== "") picked[key] = value;
  }

  return picked;
}

export function toSearchParams(params: ListingParams): URLSearchParams {
  const search = new URLSearchParams();

  for (const key of LISTING_PARAMS) {
    const value = params[key];

    if (value) search.set(key, value);
  }

  return search;
}

/**
 * A listing URL with some parameters changed.
 *
 * Setting a value to `undefined` removes it. Changing anything other than the
 * page resets the page, because page 4 of a different filter set is not a page
 * anyone asked for.
 */
export function buildListingHref(
  basePath: string,
  current: ListingParams,
  changes: ListingParams & { page?: string | undefined },
): string {
  const merged: ListingParams = { ...current };

  for (const [key, value] of Object.entries(changes) as [
    ListingParam,
    string | undefined,
  ][]) {
    if (value === undefined || value === "") delete merged[key];
    else merged[key] = value;
  }

  const changedAFilter = Object.keys(changes).some((key) =>
    PAGING_RESET.includes(key as ListingParam),
  );

  if (changedAFilter) delete merged.page;

  // Page 1 is the canonical address; carrying ?page=1 would give one listing
  // two URLs.
  if (merged.page === "1") delete merged.page;

  const query = toSearchParams(merged).toString();

  return query ? `${basePath}?${query}` : basePath;
}

/** Everything that narrows the result set — as opposed to ordering or paging. */
const FILTERS: ListingParam[] = [
  "category",
  "brand",
  "min_price",
  "max_price",
  "q",
  "featured",
  "new",
  "bestseller",
];

/**
 * The same listing with every filter dropped — sort survives, because it is a
 * preference rather than a narrowing, and a shopper clearing filters did not
 * ask to be put back in date order.
 *
 * On a category or brand page the route itself carries that filter, so it is
 * not in `current` to begin with and clearing cannot escape the section.
 */
export function clearFiltersHref(
  basePath: string,
  current: ListingParams,
): string {
  const cleared = Object.fromEntries(
    FILTERS.map((key) => [key, undefined]),
  ) as ListingParams;

  return buildListingHref(basePath, current, cleared);
}

/** How many filters (not sort, not page) are currently applied. */
export function activeFilterCount(
  params: ListingParams,
  ignore: ListingParam[] = [],
): number {
  return FILTERS.filter((key) => params[key] && !ignore.includes(key)).length;
}
