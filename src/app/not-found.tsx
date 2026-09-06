import { Compass, Home, PackageSearch } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center py-16 text-center">
      <span className="bg-primary-soft text-primary-soft-foreground mb-6 flex size-16 items-center justify-center rounded-2xl">
        <Compass className="size-8" aria-hidden />
      </span>

      <p className="text-muted-foreground font-mono text-sm">404</p>
      <h1 className="mt-2 text-3xl font-bold lg:text-4xl">Page not found</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">
        The page you are looking for has moved, or it never existed. The
        catalogue is still where you left it.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">
          <Home />
          Back to home
        </ButtonLink>
        <ButtonLink href="/products" variant="outline">
          <PackageSearch />
          Browse products
        </ButtonLink>
      </div>
    </main>
  );
}
