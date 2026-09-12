"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/services/catalog";

/*
 * Desktop navigation.
 *
 * Categories come from the live tree (PRD 5A rule 5), so a store with four
 * categories gets four links and a store with none still renders a valid bar.
 *
 * A category with children gets a flyout that opens on hover *and* on click.
 * Hover alone is not an option: it is unreachable by keyboard and unusable on
 * a touch screen that reports as a desktop. Click alone would feel broken to
 * everyone using a mouse. So both, with the button owning `aria-expanded`
 * either way.
 *
 * Every top-level category is itself a link, not just a menu trigger - the
 * "menu that cannot be visited" is a common and infuriating pattern.
 */

/** Beyond this the bar wraps; the rest stay reachable from /categories. */
const MAX_TOP_LEVEL = 6;

export function MainNav({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (openId === null) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openId]);

  // Closing on navigation matters: Next keeps this component mounted across a
  // client-side route change, so a flyout left open would follow the shopper
  // onto the page they just picked. Done on the click that navigates rather
  // than in an effect watching the pathname — same result, one render fewer,
  // and no state written from inside an effect.
  const close = () => setOpenId(null);

  const top = categories.slice(0, MAX_TOP_LEVEL);

  return (
    <nav
      ref={navRef}
      aria-label="Categories"
      /*
       * Its own row now, so it is `flex` rather than `hidden lg:flex` — the
       * wrapper in SiteHeader decides when the row exists at all.
       *
       * `flex-wrap` and not `overflow-x-auto`: a scrolling nav would clip the
       * flyouts, which are absolutely positioned children. A store with more
       * categories than fit gets a second line, which is ugly but never hides
       * anything. `justify-center` centres the row; the symmetric `-mx-3`
       * cancels the outermost links' own padding on both sides, so the visual
       * centre matches the container's.
       */
      className="-mx-3 flex flex-wrap items-center justify-center gap-1 py-1.5"
    >
      <NavLink href="/products" active={pathname === "/products"} onClick={close}>
        All products
      </NavLink>

      {top.map((category) => {
        const href = `/categories/${category.slug}`;
        const active = pathname === href;
        const hasChildren = category.children.length > 0;

        if (!hasChildren) {
          return (
            <NavLink
              key={category.id}
              href={href}
              active={active}
              onClick={close}
            >
              {category.name}
            </NavLink>
          );
        }

        return (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => setOpenId(category.id)}
            onMouseLeave={() => setOpenId(null)}
          >
            <div className="flex items-center">
              <NavLink
                href={href}
                active={active}
                onClick={close}
                className="pr-1"
              >
                {category.name}
              </NavLink>
              <button
                type="button"
                aria-expanded={openId === category.id}
                aria-label={`Show ${category.name} subcategories`}
                onClick={() =>
                  setOpenId((current) =>
                    current === category.id ? null : category.id,
                  )
                }
                className="text-muted-foreground hover:text-foreground -ml-1 rounded-md p-1.5"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-[--duration-fast]",
                    openId === category.id && "rotate-180",
                  )}
                />
              </button>
            </div>

            {openId === category.id && (
              <div className="bg-popover border-border shadow-pop animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-40 min-w-56 rounded-xl border p-2">
                <ul>
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        onClick={close}
                        className="hover:bg-accent block rounded-lg px-3 py-2 text-sm transition-colors"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {categories.length > MAX_TOP_LEVEL && (
        <NavLink
          href="/categories"
          active={pathname === "/categories"}
          onClick={close}
        >
          More
        </NavLink>
      )}
    </nav>
  );
}

function NavLink({
  href,
  active,
  className,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "hover:text-primary rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-primary" : "text-foreground/80",
        className,
      )}
    >
      {children}
    </Link>
  );
}
