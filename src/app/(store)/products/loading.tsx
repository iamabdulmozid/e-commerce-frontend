import { ListingSkeleton } from "@/components/catalog/listing-skeleton";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <Container className="py-8 lg:py-10">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-5 mb-8 h-9 w-64" />
      <ListingSkeleton />
    </Container>
  );
}
