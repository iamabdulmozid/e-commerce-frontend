"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/*
 * The mechanics every overlay in this app shares: a portal, an overlay that
 * closes on click, Escape, a locked page behind it, and focus that goes in,
 * cycles inside, and comes back out to whatever opened it.
 *
 * Hand-rolled rather than pulled from a component library (PRD 5A, D4) — and
 * extracted here so the drawer and the image lightbox cannot end up with two
 * different ideas of how a modal behaves.
 *
 * The portal matters: a panel nested inside a `position: sticky` header cannot
 * cover the page no matter what z-index it is given.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ModalShell({
  open,
  onClose,
  label,
  children,
  className,
  overlayClassName,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  /** Positioning and appearance of the panel itself. */
  className?: string;
  overlayClassName?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();

        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wrap in both directions, so Tab can never reach the page behind.
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Focus the panel itself rather than its first control, so a screen reader
    // announces what opened before reading its contents.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      restoreTo.current?.focus();
    };
  }, [open, onKeyDown]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "animate-in fade-in absolute inset-0 bg-black/50 backdrop-blur-[2px]",
          overlayClassName,
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn("absolute outline-none", className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
