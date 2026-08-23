import Link from "next/link";

/**
 * Page links for a listing.
 *
 * Real `<a href>`s, not buttons: paging is navigation, so it has to survive a
 * middle-click, a bookmark and a crawler that never runs JavaScript.
 */
export function Pagination({
  page,
  lastPage,
  basePath,
  query,
}: {
  page: number;
  lastPage: number;
  basePath: string;
  query: URLSearchParams;
}) {
  if (lastPage <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams(query);

    // Page 1 is the canonical URL; carrying `?page=1` would give the same
    // listing two addresses.
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));

    const search = next.toString();

    return search === "" ? basePath : `${basePath}?${search}`;
  };

  return (
    <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="underline" rel="prev">
          Previous
        </Link>
      ) : (
        <span className="text-muted-foreground">Previous</span>
      )}

      <span className="text-muted-foreground">
        Page {page} of {lastPage}
      </span>

      {page < lastPage ? (
        <Link href={href(page + 1)} className="underline" rel="next">
          Next
        </Link>
      ) : (
        <span className="text-muted-foreground">Next</span>
      )}
    </nav>
  );
}
