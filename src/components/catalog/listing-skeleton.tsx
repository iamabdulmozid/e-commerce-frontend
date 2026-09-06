import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

/**
 * The listing's loading shape — sidebar, toolbar, grid.
 *
 * Shared by /products, a category and a brand so all three reserve the same
 * space the real page will occupy, and nothing jumps when the data lands
 * (PRD 5B rule 15). A centred spinner would reserve none of it.
 */
export function ListingSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
      <div className="hidden space-y-7 lg:block">
        {[6, 5, 3].map((rows, section) => (
          <div key={section} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: rows }, (_, row) => (
              <Skeleton key={row} className="h-8 w-full" />
            ))}
          </div>
        ))}
      </div>

      <div>
        <div className="border-border mb-5 flex items-center justify-between border-b pb-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-52" />
        </div>

        <ProductGridSkeleton count={count} />
      </div>
    </div>
  );
}
