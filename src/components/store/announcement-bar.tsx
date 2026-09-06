"use client";

import { Truck, X } from "lucide-react";
import {
  ANNOUNCEMENT_DISMISSED_KEY,
  ANNOUNCEMENT_HIDDEN_CLASS,
} from "@/components/ui/boot-script";
import { writeStored } from "@/lib/browser-store";

/*
 * TODO(Phase 21 - CMS): this copy becomes a banner record the store owner
 * edits. Until then it is a static, deliberately claim-free line: it describes
 * how the shop works, not an offer this particular store is making. A
 * hardcoded "Free delivery over BDT 2,000" would be a promise no merchant
 * agreed to (PRD 5B rule 10).
 */
const MESSAGE =
  "Shop by category, brand or price — delivery options are shown at checkout.";

/**
 * The bar is always server-rendered, and hidden by CSS when the shopper has
 * already closed it.
 *
 * Deciding its visibility in React would mean it is absent from the first
 * paint and drops in after hydration, pushing the whole page down on every
 * cold load — the layout shift rule 7 forbids. The class comes from the
 * pre-paint boot script instead, so the very first frame is already correct
 * either way. Dismissing toggles the same class, so it disappears at once
 * without a reload.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-foreground text-background [.announcement-dismissed_&]:hidden">
      <div className="container-page flex items-center justify-center gap-3 py-2 text-xs sm:text-sm">
        <Truck
          className="hidden size-4 shrink-0 opacity-70 sm:block"
          aria-hidden
        />
        <p className="text-center">{MESSAGE}</p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            document.documentElement.classList.add(ANNOUNCEMENT_HIDDEN_CLASS);
            writeStored(ANNOUNCEMENT_DISMISSED_KEY, "1");
          }}
          className="ml-auto shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
