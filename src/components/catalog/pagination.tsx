import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buildListingHref, type ListingParams } from "@/lib/catalog-query";
import { cn } from "@/lib/utils";

/**
 * Numbered page links.
 *
 * Real <a href>s, not buttons: paging is navigation, so it has to survive a
 * middle-click, a bookmark and a crawler that never runs JavaScript.
 *
 * Numbers rather than only Previous/Next because a shopper on page 7 of 12
 * should be able to jump, and because a crawler following only "next" walks a
 * chain instead of a fan.
 */
export function Pagination({
  page,
  lastPage,
  basePath,
  params,
}: {
  page: number;
  lastPage: number;
  basePath: string;
  params: ListingParams;
}) {
  if (lastPage <= 1) return null;

  const href = (target: number) =>
    buildListingHref(basePath, params, { page: String(target) });

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <Step
        href={page > 1 ? href(page - 1) : undefined}
        rel="prev"
        label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Step>

      {pageWindow(page, lastPage).map((entry, index) =>
        entry === "gap" ? (
          <span
            key={`gap-${index}`}
            className="text-muted-foreground px-1 text-sm"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={href(entry)}
            aria-current={entry === page ? "page" : undefined}
            aria-label={`Page ${entry}`}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              entry === page
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {entry}
          </Link>
        ),
      )}

      <Step
        href={page < lastPage ? href(page + 1) : undefined}
        rel="next"
        label="Next page"
      >
        <ChevronRight className="size-4" aria-hidden />
      </Step>
    </nav>
  );
}

function Step({
  href,
  rel,
  label,
  children,
}: {
  href?: string;
  rel: "prev" | "next";
  label: string;
  children: React.ReactNode;
}) {
  const classes =
    "inline-flex size-10 items-center justify-center rounded-lg border border-border transition-colors";

  if (!href) {
    return (
      <span
        aria-hidden
        className={cn(classes, "text-muted-foreground opacity-40")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} rel={rel} aria-label={label} className={cn(classes, "hover:bg-accent")}>
      {children}
    </Link>
  );
}

/**
 * First, last, and a window around the current page, with gaps in between —
 * so a 40-page listing does not render 40 links.
 */
function pageWindow(page: number, lastPage: number): Array<number | "gap"> {
  const pages = new Set<number>([1, lastPage, page]);

  for (const offset of [-1, 1]) {
    const neighbour = page + offset;

    if (neighbour >= 1 && neighbour <= lastPage) pages.add(neighbour);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];

  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) out.push("gap");
    out.push(value);
  });

  return out;
}
