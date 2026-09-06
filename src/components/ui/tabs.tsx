"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Tabs following the ARIA authoring practice: one tab stop for the whole set,
 * arrow keys to move between tabs (a "roving tabindex"), and each panel
 * labelled by its tab.
 *
 * Making every tab its own tab stop - the obvious implementation - means a
 * keyboard user has to Tab past six of them to reach the content, which is
 * exactly the trap tabs are supposed to avoid.
 */

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({
  items,
  className,
}: {
  items: TabItem[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const base = useId();

  if (items.length === 0) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

    let next = active;

    if (delta !== 0) next = (active + delta + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;

    event.preventDefault();
    setActive(next);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  };

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className="border-border scrollbar-none flex gap-1 overflow-x-auto border-b"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${base}-tab-${item.id}`}
            aria-selected={index === active}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              index === active
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.map((item, index) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={index !== active}
          tabIndex={0}
          className="py-6"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
