import { api } from "@/lib/api";
import type { Paginated } from "@/types/auth";
import type { StockStatus } from "@/services/inventory";

/*
 * Catalog client, shared by the storefront and the admin dashboard.
 *
 * Money arrives as DECIMAL strings and stays that way - parsing prices into
 * floats is how rounding drift gets into a shop.
 */

export interface MediaRef {
  id: number;
  url: string;
  thumb_url: string;
  alt: string | null;
}

export interface Media {
  id: number;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  title: string | null;
  folder: string | null;
  status: "processing" | "ready" | "failed";
  processing_error: string | null;
  url: string;
  thumb_url: string;
  medium_url: string;
  large_url: string;
  created_at: string | null;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  depth: number;
  sort_order: number;
  status: "active" | "inactive";
  image?: MediaRef | null;
  banner?: MediaRef | null;
  seo_title: string | null;
  seo_description: string | null;
  children?: Category[];
  products_count?: number;
}

/** The public tree endpoint returns a lighter, nested shape. */
export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  depth: number;
  children: CategoryNode[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "inactive";
  sort_order: number;
  logo?: MediaRef | null;
  seo_title: string | null;
  seo_description: string | null;
  products_count?: number;
}

export interface AttributeValue {
  id: number;
  value: string;
  slug: string;
  color_hex: string | null;
  sort_order: number;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: "select" | "color" | "text";
  is_variant: boolean;
  sort_order: number;
  values?: AttributeValue[];
}

export interface VariantAttribute {
  attribute_id: number;
  attribute: string | null;
  value_id: number;
  value: string;
  color_hex: string | null;
}

export interface PriceTier {
  min_quantity: number;
  amount: string;
}

/**
 * The only price shape a client should read.
 *
 * `base` is the struck-through figure when discounted - what this shopper
 * would otherwise pay today, not the merchant's compare-at claim.
 */
export interface Pricing {
  base: string;
  effective: string;
  savings: string | null;
  is_discounted: boolean;
  tiers?: PriceTier[];
}

export interface Variant {
  id: number;
  sku: string;
  barcode?: string | null;
  /** The base column. Read `pricing.effective` to display a price. */
  price: string;
  compare_price?: string | null;
  pricing?: Pricing;
  /** Three-state signal. The public API never sends a quantity. */
  stock?: { status: StockStatus };
  /** Admin only; absent from every public response. */
  cost?: string | null;
  weight?: string | null;
  status: "active" | "inactive";
  is_default: boolean;
  attributes: VariantAttribute[];
}

export interface PriceRule {
  id: number;
  variant_id: number;
  customer_group_id: number | null;
  customer_group?: { id: number; name: string } | null;
  name: string | null;
  amount: string;
  min_quantity: number;
  starts_at: string | null;
  ends_at: string | null;
  status: "active" | "inactive";
  variant?: { id: number; sku: string; price: string; product_id: number };
  created_at: string | null;
}

export interface PriceRulePayload {
  variant_id?: number;
  customer_group_id?: number | null;
  name?: string | null;
  amount?: string;
  min_quantity?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: "active" | "inactive";
}

export interface PricePreviewRow {
  variant_id: number;
  sku: string;
  base: string;
  effective: string;
  savings: string | null;
  is_discounted: boolean;
  rule_id: number | null;
  rule_name: string | null;
}

export interface ProductImage {
  id: number;
  media_id: number;
  variant_id: number | null;
  is_primary: boolean;
  sort_order: number;
  url: string;
  thumb_url: string;
  alt: string;
}

/**
 * A card's price, already reduced server-side.
 *
 * `base_*` is what the same shopper would otherwise pay today, so the
 * struck-through figure on a card is the honest comparison rather than the
 * merchant's compare-at claim — the same rule the detail page follows.
 *
 * `discount_percent` is rounded down and is the biggest saving on any single
 * variant, never the cheapest variant measured against the dearest one.
 */
export interface PriceRange {
  min: string;
  max: string;
  base_min: string;
  base_max: string;
  is_discounted: boolean;
  discount_percent: number | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  product_type: "simple" | "variable";
  short_description: string | null;
  description?: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  brand?: { id: number; name: string; slug: string } | null;
  primary_image?: { url: string; thumb_url: string; alt: string } | null;
  price_range?: PriceRange | null;
  /** ISO-8601. Set only when a time-boxed rule is what makes this cheap. */
  sale_ends_at?: string | null;
  /**
   * A signal, never a count (Phase 7 rule 19). `any_variant_available` gates
   * the buy button; `status` drives the badge, and reports the BEST of the
   * variants so a product with one scarce colour is not labelled low stock.
   */
  stock?: { status: StockStatus; any_variant_available: boolean };
  categories?: Array<{ id: number; name: string; slug: string }>;
  variants?: Variant[];
  images?: ProductImage[];
  seo_title?: string | null;
  seo_description?: string | null;
  created_at: string | null;
}

/**
 * The flash sale: what is discounted with a deadline, and when the first of
 * those deadlines passes.
 *
 * `ends_at` null means there is no flash sale running. It is the server's
 * answer, not an absence of data — the storefront renders nothing rather than
 * counting down to something it made up.
 *
 * The deadline is deliberately not derived from `items`: the soonest-ending
 * offer in the store need not be among the handful the rail shows.
 */
export interface FlashSale {
  ends_at: string | null;
  items: Product[];
  /** Across the whole sale, not just the products returned here. */
  total: number;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
  featured?: boolean;
  new?: boolean;
  flash_sale?: boolean;
  q?: string;
  status?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}

/*
 * Write payloads.
 *
 * Deliberately not `Partial<Category>` and friends: the API returns a nested
 * `image` object but accepts an `image_id`, so reusing the read shape would
 * type-check a request the server rejects.
 */

export interface CategoryPayload {
  name?: string;
  slug?: string | null;
  description?: string | null;
  parent_id?: number | null;
  image_id?: number | null;
  banner_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number;
  status?: "active" | "inactive";
}

export interface BrandPayload {
  name?: string;
  slug?: string | null;
  description?: string | null;
  logo_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number;
  status?: "active" | "inactive";
}

export interface AttributeValuePayload {
  id?: number;
  value: string;
  slug?: string | null;
  color_hex?: string | null;
  sort_order?: number;
}

export interface AttributePayload {
  name?: string;
  slug?: string | null;
  type?: Attribute["type"];
  is_variant?: boolean;
  sort_order?: number;
  values?: AttributeValuePayload[];
}

type QueryValue = string | number | boolean | undefined;

function query(params: Record<string, QueryValue> | ProductFilters) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "" && v !== false)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
}

export const catalogService = {
  // --- storefront -------------------------------------------------------
  products: (filters: ProductFilters = {}) =>
    api.get<Paginated<Product>>(`/products?${query(filters)}`),
  product: (slug: string) => api.get<Product>(`/products/${slug}`),
  flashSale: () => api.get<FlashSale>("/flash-sale"),
  categoryTree: () => api.get<{ items: CategoryNode[] }>("/categories"),
  category: (slug: string) => api.get<Category>(`/categories/${slug}`),
  brands: () => api.get<{ items: Brand[] }>("/brands"),
  brand: (slug: string) => api.get<Brand>(`/brands/${slug}`),

  // --- admin ------------------------------------------------------------
  admin: {
    media: (params: { folder?: string; q?: string; per_page?: number } = {}) =>
      api.get<Paginated<Media>>(`/admin/media?${query(params)}`),
    uploadMedia: (file: File, folder?: string) => {
      const body = new FormData();
      body.append("file", file);
      if (folder) body.append("folder", folder);

      // No Content-Type header: the browser must set the multipart boundary,
      // and overriding it produces an unparseable request.
      return api.post<Media>("/admin/media", undefined, { body });
    },
    updateMedia: (id: number, payload: { alt?: string; title?: string }) =>
      api.patch<Media>(`/admin/media/${id}`, payload),
    deleteMedia: (id: number) => api.delete<null>(`/admin/media/${id}`),

    categories: (params: { status?: string } = {}) =>
      api.get<{ items: Category[] }>(`/admin/categories?${query(params)}`),
    createCategory: (payload: CategoryPayload) =>
      api.post<Category>("/admin/categories", payload),
    updateCategory: (id: number, payload: CategoryPayload) =>
      api.patch<Category>(`/admin/categories/${id}`, payload),
    deleteCategory: (id: number) => api.delete<null>(`/admin/categories/${id}`),
    // The whole level goes in one call so positions cannot half-apply.
    reorderCategories: (items: Array<{ id: number; sort_order: number }>) =>
      api.put<null>("/admin/categories/reorder", { items }),

    brands: (params: { q?: string; per_page?: number } = {}) =>
      api.get<Paginated<Brand>>(`/admin/brands?${query(params)}`),
    createBrand: (payload: BrandPayload) =>
      api.post<Brand>("/admin/brands", payload),
    updateBrand: (id: number, payload: BrandPayload) =>
      api.patch<Brand>(`/admin/brands/${id}`, payload),
    deleteBrand: (id: number) => api.delete<null>(`/admin/brands/${id}`),

    attributes: (variantOnly = false) =>
      api.get<{ items: Attribute[] }>(
        `/admin/attributes?${query({ variant_only: variantOnly })}`,
      ),
    saveAttribute: (payload: AttributePayload, id?: number) =>
      id
        ? api.patch<Attribute>(`/admin/attributes/${id}`, payload)
        : api.post<Attribute>("/admin/attributes", payload),
    deleteAttribute: (id: number) =>
      api.delete<null>(`/admin/attributes/${id}`),

    priceRules: (
      params: {
        variant_id?: number;
        customer_group_id?: number;
        status?: string;
        per_page?: number;
      } = {},
    ) => api.get<Paginated<PriceRule>>(`/admin/price-rules?${query(params)}`),
    productPriceRules: (productId: number) =>
      api.get<{ items: PriceRule[] }>(
        `/admin/products/${productId}/price-rules`,
      ),
    savePriceRule: (payload: PriceRulePayload, id?: number) =>
      id
        ? api.patch<PriceRule>(`/admin/price-rules/${id}`, payload)
        : api.post<PriceRule>("/admin/price-rules", payload),
    deletePriceRule: (id: number) =>
      api.delete<null>(`/admin/price-rules/${id}`),
    previewPrices: (
      productId: number,
      payload: {
        customer_group_id?: number | null;
        quantity?: number;
        at?: string;
      },
    ) =>
      api.post<{ variants: PricePreviewRow[] }>(
        `/admin/products/${productId}/price-preview`,
        payload,
      ),

    products: (filters: ProductFilters = {}) =>
      api.get<Paginated<Product>>(`/admin/products?${query(filters)}`),
    product: (id: number) => api.get<Product>(`/admin/products/${id}`),
    createProduct: (payload: Record<string, unknown>) =>
      api.post<Product>("/admin/products", payload),
    updateProduct: (id: number, payload: Record<string, unknown>) =>
      api.patch<Product>(`/admin/products/${id}`, payload),
    deleteProduct: (id: number) => api.delete<null>(`/admin/products/${id}`),

    addVariant: (productId: number, payload: Record<string, unknown>) =>
      api.post<Product>(`/admin/products/${productId}/variants`, payload),
    updateVariant: (
      productId: number,
      variantId: number,
      payload: Record<string, unknown>,
    ) =>
      api.patch<Product>(
        `/admin/products/${productId}/variants/${variantId}`,
        payload,
      ),
    deleteVariant: (productId: number, variantId: number) =>
      api.delete<null>(`/admin/products/${productId}/variants/${variantId}`),
    generateVariants: (
      productId: number,
      payload: {
        attributes: Record<number, number[]>;
        sku_prefix: string;
        price: string;
      },
    ) =>
      api.post<Product>(
        `/admin/products/${productId}/variants/generate`,
        payload,
      ),

    syncImages: (
      productId: number,
      images: Array<{
        media_id: number;
        variant_id?: number | null;
        is_primary?: boolean;
        sort_order?: number;
      }>,
    ) => api.put<Product>(`/admin/products/${productId}/images`, { images }),
  },
};
