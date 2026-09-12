import Link from "next/link";
import { Suspense } from "react";
import { HeaderActions } from "@/components/store/header-actions";
import { MainNav } from "@/components/store/main-nav";
import { MobileNav } from "@/components/store/mobile-nav";
import { SearchForm } from "@/components/store/search-form";
import { StoreLogo } from "@/components/store/store-logo";
import type { CategoryNode } from "@/services/catalog";

/**
 * The store header — a Server Component that composes four client islands.
 *
 * Sticky with a translucent background rather than a scroll listener: the same
 * result, no JavaScript, and nothing to keep in sync with the scroll position.
 *
 * The category nav gets its own row from `lg`, and that is not decoration.
 * Measured against the demo catalogue, one row wanted roughly 1385px before
 * the search box was allotted a single pixel: six nav items at ~896px, plus
 * the logo, the account actions, the gaps and the gutters. At 1440px the
 * search pill was squeezed under its own min-content width and spilled over
 * the theme toggle; below ~1385px the nav itself overflowed. Flex cannot solve
 * that — nothing shrinks a row of nav links below the width of their text — so
 * the row count has to change. Every large storefront splits the header for
 * the same reason.
 */
export function SiteHeader({
  categories,
  storeName,
}: {
  categories: CategoryNode[];
  storeName: string;
}) {
  return (
    <header className="bg-card/85 border-border sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
        <MobileNav categories={categories} />

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 pr-1"
          aria-label={`${storeName} home`}
        >
          <StoreLogo />
          <span className="font-display hidden truncate text-lg font-bold tracking-tight sm:block">
            {storeName}
          </span>
        </Link>

        {/*
          useSearchParams needs a boundary so a statically rendered route can
          still stream the rest of the header.

          `min-w-0` matters on a flex child holding a text input: without it the
          input's intrinsic width sets the floor and the pill refuses to shrink,
          shoving the account menu off the end.

          The wrapper still takes the whole middle of the row, but the field
          itself is capped and centred inside it. Letting `flex-1` size the pill
          directly stretched it to ~830px on a wide screen, which reads as a
          slab rather than a control — a search box should look like something
          you type a couple of words into.
        */}
        <Suspense fallback={<div className="hidden h-11 flex-1 md:block" />}>
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchForm className="mx-auto max-w-sm lg:max-w-md" />
          </div>
        </Suspense>

        <div className="ml-auto flex shrink-0 items-center md:ml-1">
          <HeaderActions />
        </div>
      </div>

      {/* Below md the search bar gets its own row rather than being crushed
          between the logo and the account menu. */}
      <Suspense fallback={null}>
        <div className="container-page pb-3 md:hidden">
          <SearchForm />
        </div>
      </Suspense>

      {/* Categories, from lg. Its own row for the reasons in the note above. */}
      <div className="border-border/70 hidden border-t lg:block">
        <div className="container-page">
          <MainNav categories={categories} />
        </div>
      </div>
    </header>
  );
}
