"use client";

import { X } from "lucide-react";
import { ModalShell } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

/**
 * A sliding panel: the mobile navigation, and the catalog filter sheet.
 *
 * All of the dialog mechanics — portal, focus trap, Escape, scroll lock —
 * live in `ModalShell`. This adds the geometry and a titled header.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "left",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
  className?: string;
}) {
  const sides = {
    left: "inset-y-0 left-0 h-full w-[min(22rem,88vw)] animate-in slide-in-from-left",
    right:
      "inset-y-0 right-0 h-full w-[min(22rem,88vw)] animate-in slide-in-from-right",
    bottom:
      "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl animate-in slide-in-from-bottom",
  } as const;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      label={title}
      className={cn(
        "bg-background shadow-pop flex flex-col duration-[--duration-base]",
        sides[side],
        className,
      )}
    >
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <p className="font-display font-semibold">{title}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-10 items-center justify-center rounded-full transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </ModalShell>
  );
}
