import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover feedback. Only for cards that are themselves a link. */
  interactive?: boolean;
  /** Removes the default padding, for cards whose child owns its own. */
  flush?: boolean;
}

export function Card({
  className,
  interactive = false,
  flush = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground border-border shadow-card rounded-xl border",
        !flush && "p-6",
        interactive &&
          "hover:shadow-pop transition-shadow duration-[--duration-base]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-display text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-border flex items-center gap-3 border-t pt-4", className)}
      {...props}
    />
  );
}
