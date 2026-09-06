import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { CategoryNode } from "@/services/catalog";

/**
 * The footer.
 *
 * It carries the full category list as plain server-rendered links, which is
 * what makes the mobile menu's JavaScript optional (PRD 5A rule 10) and gives
 * a crawler a path to every category from every page.
 *
 * Deliberately absent: payment-method logos, courier badges, delivery or
 * returns promises, and a newsletter box. None of those capabilities exist
 * yet, and a footer that advertises them is the same lie as a fake stock
 * label (PRD 5A rule 6). They arrive with Phases 11, 15, 21 and 23.
 *
 * TODO(Phase 21 - CMS): About, Contact, FAQ, Terms, Privacy, Returns become
 * real /pages/[slug] links here.
 */
export function SiteFooter({
  categories,
  storeName,
}: {
  categories: CategoryNode[];
  storeName: string;
}) {
  return (
    <footer className="bg-card border-border mt-16 border-t">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
              <ShoppingBag className="size-5" aria-hidden />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              {storeName}
            </span>
          </Link>

          <p className="text-muted-foreground mt-4 max-w-xs text-sm">
            Browse the full catalogue by category, brand or price. Create an
            account to keep your details and addresses ready.
          </p>
        </div>

        <FooterColumn title="Shop">
          <FooterLink href="/products">All products</FooterLink>
          <FooterLink href="/categories">Categories</FooterLink>
          <FooterLink href="/brands">Brands</FooterLink>
          <FooterLink href="/products?sort=newest">New arrivals</FooterLink>
        </FooterColumn>

        {categories.length > 0 && (
          <FooterColumn title="Categories">
            {categories.slice(0, 6).map((category) => (
              <FooterLink
                key={category.id}
                href={`/categories/${category.slug}`}
              >
                {category.name}
              </FooterLink>
            ))}
          </FooterColumn>
        )}

        <FooterColumn title="Account">
          <FooterLink href="/account">My account</FooterLink>
          <FooterLink href="/account/addresses">Addresses</FooterLink>
          <FooterLink href="/login">Sign in</FooterLink>
          <FooterLink href="/register">Create an account</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-border border-t">
        <div className="container-page text-muted-foreground flex flex-wrap items-center justify-between gap-2 py-5 text-xs">
          <p>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <p>Powered by the platform.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-[0.12em] uppercase">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
