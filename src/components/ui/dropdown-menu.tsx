"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * A small menu hung off a trigger - the account menu, and the nav's category
 * flyout.
 *
 * The accessibility contract, made explicit:
 *   - the trigger owns `aria-expanded` and `aria-haspopup`
 *   - ArrowDown/ArrowUp move between items, Home/End jump
 *   - Escape closes and returns focus to the trigger
 *   - a click anywhere else closes it
 */

interface DropdownMenuProps {
  trigger: (props: {
    open: boolean;
    id: string;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    "aria-controls": string;
    onClick: () => void;
  }) => React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const triggerId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const items = menuRef.current
        ? [...menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')]
        : [];

      if (event.key === "Escape") {
        setOpen(false);
        document.getElementById(triggerId)?.focus();

        return;
      }

      if (items.length === 0) return;

      const index = items.indexOf(document.activeElement as HTMLElement);

      const move = (next: number) => {
        event.preventDefault();
        items[(next + items.length) % items.length].focus();
      };

      if (event.key === "ArrowDown") move(index + 1);
      else if (event.key === "ArrowUp") move(index - 1);
      else if (event.key === "Home") move(0);
      else if (event.key === "End") move(items.length - 1);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, triggerId]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        open,
        id: triggerId,
        "aria-expanded": open,
        "aria-haspopup": "menu",
        "aria-controls": menuId,
        onClick: () => setOpen((value) => !value),
      })}

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          onClick={() => setOpen(false)}
          className={cn(
            "bg-popover text-popover-foreground border-border shadow-pop animate-in fade-in slide-in-from-top-1 absolute top-[calc(100%+0.5rem)] z-40 min-w-52 rounded-xl border p-1.5",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const itemClasses =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function DropdownItem({
  href,
  onClick,
  children,
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} role="menuitem" className={cn(itemClasses, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(itemClasses, className)}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="bg-border my-1.5 h-px" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-1.5 pb-2">
      <p className="truncate text-sm font-medium">{children}</p>
    </div>
  );
}
