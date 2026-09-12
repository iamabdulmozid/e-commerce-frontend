"use client";

import { Phone, Truck, X } from "lucide-react";
import {
  ANNOUNCEMENT_DISMISSED_KEY,
  ANNOUNCEMENT_HIDDEN_CLASS,
} from "@/components/ui/boot-script";
import { writeStored } from "@/lib/browser-store";

/*
 * TODO(Phase 21 - CMS): this copy and the hotline become banner records the
 * store owner edits. Until then it is a static, deliberately claim-free line:
 * it describes how the shop works, not an offer this particular store is
 * making. A hardcoded "Free delivery over BDT 2,000" would be a promise no
 * merchant agreed to (PRD 5B rule 10). The number is a placeholder in the
 * local (BD) format shoppers expect.
 */
const MESSAGE =
  "Shop by category, brand or price — delivery options are shown at checkout.";
const CONTACT_NUMBER = "+880 1700-000000";
const CONTACT_HREF = "tel:+8801700000000";

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
      {/*
       * The message sits in the middle column of a three-column grid so it is
       * centred against the page, not against whatever is left over after the
       * hotline — the outer columns are the same width regardless of content.
       */}
      <div className="container-page grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 text-xs sm:text-sm">
        <Truck
          className="hidden size-4 shrink-0 opacity-70 sm:block"
          aria-hidden
        />
        <p className="col-start-2 text-center">{MESSAGE}</p>
        <div className="col-start-3 flex items-center justify-end gap-2">
          <a
            href={CONTACT_HREF}
            className="hidden items-center gap-1.5 opacity-80 transition-opacity hover:opacity-100 sm:flex"
          >
            <Phone className="size-3.5 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{CONTACT_NUMBER}</span>
          </a>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => {
              document.documentElement.classList.add(ANNOUNCEMENT_HIDDEN_CLASS);
              writeStored(ANNOUNCEMENT_DISMISSED_KEY, "1");
            }}
            className="shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
