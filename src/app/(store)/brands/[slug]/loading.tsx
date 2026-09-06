import { ListingSkeleton } from "@/components/catalog/listing-skeleton";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandLoading() {
  return (
    <Container className="py-8 lg:py-10">
      <Skeleton className="h-4 w-52" />
      <Skeleton className="mt-6 mb-8 h-40 w-full rounded-2xl" />
      <ListingSkeleton />
    </Container>
  );
}
