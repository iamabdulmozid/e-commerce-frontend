"use client";

import { ChevronRight, LayoutGrid, LogIn, Menu, Tag, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SearchForm } from "@/components/store/search-form";
import { useAuth } from "@/components/auth/auth-provider";
import { Drawer } from "@/components/ui/drawer";
import type { CategoryNode } from "@/services/catalog";

/**
 * The whole navigation, for a phone.
 *
 * One level of nesting is shown inline rather than behind an accordion: the
 * category depth cap is three, so the whole tree is small, and a shopper
 * scrolling a list beats a shopper opening four accordions to find "Shoes".
 *
 * With JavaScript off this button does nothing - which is why the footer
 * carries the same category links as plain markup (PRD 5A rule 10).
 */
export function MobileNav({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="text-foreground hover:bg-accent inline-flex size-10 items-center justify-center rounded-full transition-colors lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <Drawer open={open} onClose={close} title="Menu" side="left">
        <div className="border-border border-b p-4">
          <SearchForm onSubmitted={close} />
        </div>

        <nav aria-label="Store" className="p-2">
          <DrawerLink href="/products" icon={LayoutGrid} onClick={close}>
            All products
          </DrawerLink>
          <DrawerLink href="/brands" icon={Tag} onClick={close}>
            Brands
          </DrawerLink>
        </nav>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="border-border border-t p-2">
            <p className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-semibold tracking-wider uppercase">
              Categories
            </p>

            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  <DrawerLink
                    href={`/categories/${category.slug}`}
                    onClick={close}
                  >
                    {category.name}
                  </DrawerLink>

                  {category.children.length > 0 && (
                    <ul className="mb-1 ml-3 border-l pl-3">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/categories/${child.slug}`}
                            onClick={close}
                            className="text-muted-foreground hover:text-foreground block rounded-lg px-3 py-2 text-sm transition-colors"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav aria-label="Account" className="border-border border-t p-2">
          {user ? (
            <DrawerLink href="/account" onClick={close}>
              My account
            </DrawerLink>
          ) : (
            <>
              <DrawerLink href="/login" icon={LogIn} onClick={close}>
                Sign in
              </DrawerLink>
              <DrawerLink href="/register" icon={UserPlus} onClick={close}>
                Create an account
              </DrawerLink>
            </>
          )}
        </nav>
      </Drawer>
    </>
  );
}

function DrawerLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon?: typeof Menu;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
    >
      {Icon && <Icon className="text-muted-foreground size-4" aria-hidden />}
      <span className="flex-1">{children}</span>
      <ChevronRight className="text-muted-foreground size-4" aria-hidden />
    </Link>
  );
}
