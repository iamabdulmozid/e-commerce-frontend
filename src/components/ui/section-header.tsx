import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The repeating unit of the home page: an eyebrow, a heading, and an optional
 * way to see the rest.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  className,
  headingLevel: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-primary text-xs font-semibold tracking-[0.12em] uppercase">
            {eyebrow}
          </p>
        )}
        <Heading className="mt-1 text-2xl font-bold lg:text-3xl">
          {title}
        </Heading>
        {description && (
          <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm">
            {description}
          </p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="text-primary hover:text-primary-hover group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium"
        >
          {linkLabel}
          <ArrowRight
            className="size-4 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
