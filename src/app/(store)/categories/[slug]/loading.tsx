import { ListingSkeleton } from "@/components/catalog/listing-skeleton";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <Container className="py-8 lg:py-10">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-6 aspect-[21/9] w-full rounded-2xl" />
      <Skeleton className="mt-7 h-9 w-72" />
      <Skeleton className="mt-3 mb-8 h-4 w-full max-w-2xl" />
      <ListingSkeleton />
    </Container>
  );
}
