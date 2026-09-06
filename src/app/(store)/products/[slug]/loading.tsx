import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <Container className="py-8 lg:py-10">
      <Skeleton className="h-4 w-72" />

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="mt-3 flex gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-18 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="space-y-7">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <Skeleton className="h-9 w-48" />

          <div className="space-y-2.5">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
          </div>

          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </Container>
  );
}
