import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Brand, CategoryNode } from "@/services/catalog";

/**
 * Filter sidebar.
 *
 * Plain links rather than a client-side form: each filter combination gets its
 * own URL, which is what makes the results shareable, bookmarkable and
 * crawlable. Interactivity would cost all three for no gain.
 */
export function CatalogFilters({
  categories,
  brands,
  active,
}: {
  categories: CategoryNode[];
  brands: Brand[];
  active: { category?: string; brand?: string; sort?: string };
}) {
  return (
    <aside className="space-y-6 text-sm">
      <Section title="Sort">
        {[
          ["newest", "Newest"],
          ["price_asc", "Price: low to high"],
          ["price_desc", "Price: high to low"],
          ["name", "Name"],
        ].map(([value, label]) => (
          <FilterLink
            key={value}
            href={buildHref(active, { sort: value })}
            active={(active.sort ?? "newest") === value}
          >
            {label}
          </FilterLink>
        ))}
      </Section>

      <Section title="Category">
        <FilterLink href={buildHref(active, { category: undefined })} active={!active.category}>
          All
        </FilterLink>
        {categories.map((category) => (
          <CategoryLinks key={category.id} node={category} active={active} depth={0} />
        ))}
      </Section>

      <Section title="Brand">
        <FilterLink href={buildHref(active, { brand: undefined })} active={!active.brand}>
          All
        </FilterLink>
        {brands.map((brand) => (
          <FilterLink
            key={brand.id}
            href={buildHref(active, { brand: brand.slug })}
            active={active.brand === brand.slug}
          >
            {brand.name}
          </FilterLink>
        ))}
      </Section>
    </aside>
  );
}

function CategoryLinks({
  node,
  active,
  depth,
}: {
  node: CategoryNode;
  active: { category?: string; brand?: string; sort?: string };
  depth: number;
}) {
  return (
    <>
      <FilterLink
        href={buildHref(active, { category: node.slug })}
        active={active.category === node.slug}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {node.name}
      </FilterLink>
      {node.children.map((child) => (
        <CategoryLinks key={child.id} node={child} active={active} depth={depth + 1} />
      ))}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-medium">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  style,
  children,
}: {
  href: string;
  active: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={style}
      className={cn("block", active ? "font-medium" : "text-muted-foreground hover:underline")}
    >
      {children}
    </Link>
  );
}

/** Changing one filter keeps the others; page resets, since page 4 of a
 *  different filter set is meaningless. */
function buildHref(
  active: { category?: string; brand?: string; sort?: string },
  change: Partial<{ category?: string; brand?: string; sort?: string }>,
): string {
  const merged = { ...active, ...change };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
}
