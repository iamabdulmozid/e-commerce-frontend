import { cn } from "@/lib/utils";

/**
 * The page's horizontal rhythm, in one place.
 *
 * Every storefront page uses this instead of repeating `mx-auto max-w-7xl
 * px-6`, which is how three pages end up with three different gutters.
 */
export function Container({
  className,
  as: Component = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
}) {
  return <Component className={cn("container-page", className)} {...props} />;
}

/** Vertical rhythm between the bands of a page. */
export function Section({
  className,
  as: Component = "section",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
}) {
  return (
    <Component className={cn("py-12 lg:py-[4.5rem]", className)} {...props} />
  );
}
