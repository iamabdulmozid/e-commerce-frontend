import { headers } from "next/headers";
import { serverFetch } from "@/lib/server-api";
import { tenantFromHost } from "@/lib/tenant";
import type { CategoryNode } from "@/services/catalog";

/**
 * Shell data: what the header and footer need on every single page.
 *
 * Two rules govern this file.
 *
 * First, the shell must never be the reason a page fails. A category tree that
 * cannot be fetched - the API is down, the store is suspended, the tenant does
 * not resolve - degrades to an empty nav. The page below the header is still
 * responsible for reporting the real failure with its own error UI; a header
 * that throws would replace that specific message with a blank screen.
 *
 * Second, this is cached hard. It is the same answer for every visitor and it
 * is fetched on every navigation, so a short revalidate window is the
 * difference between one query and one query per page view.
 */

const NAV_REVALIDATE = 300;

export async function loadNavCategories(): Promise<CategoryNode[]> {
  try {
    const { items } = await serverFetch<{ items: CategoryNode[] }>(
      "/categories",
      NAV_REVALIDATE,
    );

    return items;
  } catch {
    return [];
  }
}

/**
 * A display name for the store.
 *
 * Derived from the subdomain the shopper is actually on, because that is the
 * only name the platform knows today - there is no store-settings endpoint
 * until the settings phase. Inventing a prettier one would be inventing data.
 */
export async function loadStoreName(): Promise<string> {
  const incoming = await headers();
  const slug = tenantFromHost(incoming.get("host") ?? "");

  if (!slug) return "Store";

  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
