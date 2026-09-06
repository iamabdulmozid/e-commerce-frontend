import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * What a list shows when it has nothing.
 *
 * Always with a way forward: a dead end that only says "no results" leaves a
 * shopper to work out on their own that the filters they set are the reason.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="bg-muted text-muted-foreground mb-4 flex size-14 items-center justify-center rounded-full">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <p className="font-display text-lg font-semibold">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
