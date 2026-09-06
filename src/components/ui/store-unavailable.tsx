import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreUnavailableProps {
  /**
   * The API's machine-readable reason:
   *   tenant_inactive        - provisioning, provision_failed or suspended
   *   subscription_suspended - unpaid (Phase 3B)
   */
  code?: string;
  className?: string;
}

const messages: Record<string, { title: string; body: string }> = {
  tenant_inactive: {
    title: "This store is currently unavailable",
    body: "The store owner is setting things up or has paused the shop. Please check back shortly.",
  },
  subscription_suspended: {
    title: "This store is temporarily closed",
    body: "The shop is not accepting orders right now. Please check back soon.",
  },
};

const fallback = {
  title: "This store is currently unavailable",
  body: "Please try again in a few minutes.",
};

/**
 * Rendered when the API answers 503 for a store that exists but is not
 * serving.
 *
 * Kept deliberately vague to shoppers: "unavailable" rather than "the owner
 * has not paid". The tenant's billing state is between the tenant and the
 * platform, and is nobody else's business.
 */
export function StoreUnavailable({ code, className }: StoreUnavailableProps) {
  const { title, body } = (code && messages[code]) || fallback;

  return (
    <div
      className={cn(
        "container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center",
        className,
      )}
      role="status"
    >
      <span className="bg-muted text-muted-foreground mb-6 flex size-16 items-center justify-center rounded-2xl">
        <Store className="size-8" aria-hidden />
      </span>

      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm">{body}</p>
    </div>
  );
}
