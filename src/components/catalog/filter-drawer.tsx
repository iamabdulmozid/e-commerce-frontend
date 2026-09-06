"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import type { ListingParam, ListingParams } from "@/lib/catalog-query";
import type { Brand, CategoryNode } from "@/services/catalog";

/**
 * The filter panel, for a phone.
 *
 * It renders the same `CatalogFilters` as the desktop sidebar and produces the
 * same URLs (PRD 5B, D6). The drawer is a different surface for the same
 * state, not a second copy of it — which is why a filtered view is still
 * shareable from a phone, and why the two can never disagree.
 */
export function FilterDrawer({
  categories,
  brands,
  active,
  basePath,
  fixed,
  activeCount,
}: {
  categories: CategoryNode[];
  brands: Brand[];
  active: ListingParams;
  basePath: string;
  fixed?: ListingParam[];
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="border-border hover:bg-accent inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {activeCount > 0 && (
          <Badge tone="primary" size="sm">
            {activeCount}
          </Badge>
        )}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Filters" side="bottom">
        <div className="p-4">
          <CatalogFilters
            categories={categories}
            brands={brands}
            active={active}
            basePath={basePath}
            fixed={fixed}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </Drawer>
    </>
  );
}
