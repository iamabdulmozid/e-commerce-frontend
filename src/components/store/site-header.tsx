import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { HeaderActions } from "@/components/store/header-actions";
import { MainNav } from "@/components/store/main-nav";
import { MobileNav } from "@/components/store/mobile-nav";
import { SearchForm } from "@/components/store/search-form";
import type { CategoryNode } from "@/services/catalog";

/**
 * The store header — a Server Component that composes four client islands.
 *
 * Sticky with a translucent background rather than a scroll listener: the same
 * result, no JavaScript, and nothing to keep in sync with the scroll position.
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
      <div className="container-page flex h-16 items-center gap-2 lg:h-18 lg:gap-4">
        <MobileNav categories={categories} />

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 pr-1 lg:pr-3"
          aria-label={`${storeName} home`}
        >
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
          <span className="font-display hidden truncate text-lg font-bold tracking-tight sm:block">
            {storeName}
          </span>
        </Link>

        <MainNav categories={categories} />

        {/* useSearchParams needs a boundary so a statically rendered route can
            still stream the rest of the header. */}
        <Suspense fallback={<div className="h-11 flex-1" />}>
          <div className="mx-auto hidden max-w-md flex-1 md:block">
            <SearchForm />
          </div>
        </Suspense>

        <div className="ml-auto flex items-center md:ml-0">
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
    </header>
  );
}
