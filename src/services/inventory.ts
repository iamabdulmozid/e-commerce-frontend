import { api } from "@/lib/api";
import type { Paginated } from "@/types/auth";

/*
 * Inventory client (Phase 7).
 *
 * Note what is NOT here: any way to write a ledger row. Every movement is the
 * side effect of a named business event - a receipt, an adjustment, an
 * approval - so the ledger can always answer "why", not just "what".
 *
 * Quantities are plain integers rather than DECIMAL strings, unlike money.
 * Stock is countable; a half unit is a different product.
 */

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "RESERVATION"
  | "RELEASE"
  | "RETURN"
  | "DAMAGE"
  | "ADJUSTMENT"
  | "CANCELLATION"
  | "TRANSFER";

export type AdjustmentReason =
  | "recount"
  | "damage"
  | "theft"
  | "expiry"
  | "found"
  | "correction"
  | "opening_balance";

export type AdjustmentStatus = "pending" | "applied" | "rejected";

export interface InventoryLevel {
  variant_id: number;
  on_hand: number;
  reserved: number;
  available: number;
  status: StockStatus;
  low_stock_threshold: number;
  track_inventory: boolean;
  backorder_allowed: boolean;
  updated_at: string | null;
  variant?: {
    id: number;
    sku: string;
    price: string;
    status: string;
    product: { id: number; name: string; slug: string } | null;
  };
}

export interface InventoryTransaction {
  id: number;
  variant_id: number;
  type: MovementType;
  type_label: string;
  /** Signed: negative is stock leaving. */
  quantity: number;
  /** On-hand after this row - the history is unreadable without it. */
  balance_after: number;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  actor?: { id: number; name: string } | null;
  created_at: string | null;
}

export interface StockAdjustment {
  id: number;
  variant_id: number;
  delta: number;
  reason: AdjustmentReason;
  reason_label: string;
  note: string | null;
  status: AdjustmentStatus;
  requested_by?: { id: number; name: string } | null;
  approved_by?: { id: number; name: string } | null;
  decided_at: string | null;
  decision_note: string | null;
  variant?: { id: number; sku: string };
  created_at: string | null;
}

export interface InventoryOptions {
  reasons: { value: AdjustmentReason; label: string }[];
  movement_types: { value: MovementType; label: string }[];
  /** Adjustments above this need a second pair of eyes. */
  approval_threshold: number;
}

export interface InventorySettingsPayload {
  low_stock_threshold?: number;
  track_inventory?: boolean;
  backorder_allowed?: boolean;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }

  return search.toString();
}

export const inventoryService = {
  levels: (
    params: {
      q?: string;
      status?: StockStatus | "";
      sort?: string;
      page?: number;
      per_page?: number;
    } = {},
  ) => api.get<Paginated<InventoryLevel>>(`/admin/inventory?${query(params)}`),

  show: (variantId: number) =>
    api.get<{
      inventory: InventoryLevel;
      transactions: InventoryTransaction[];
    }>(`/admin/inventory/${variantId}`),

  transactions: (
    params: {
      variant_id?: number;
      type?: MovementType | "";
      from?: string;
      to?: string;
      page?: number;
      per_page?: number;
    } = {},
  ) =>
    api.get<Paginated<InventoryTransaction>>(
      `/admin/inventory/transactions?${query(params)}`,
    ),

  options: () => api.get<InventoryOptions>("/admin/inventory/options"),

  updateSettings: (variantId: number, payload: InventorySettingsPayload) =>
    api.patch<InventoryLevel>(
      `/admin/inventory/${variantId}/settings`,
      payload,
    ),

  receive: (payload: { variant_id: number; quantity: number; note?: string }) =>
    api.post<InventoryTransaction>("/admin/inventory/receipts", payload),

  adjustments: (
    params: {
      status?: AdjustmentStatus | "";
      variant_id?: number;
      page?: number;
      per_page?: number;
    } = {},
  ) =>
    api.get<Paginated<StockAdjustment>>(
      `/admin/inventory/adjustments?${query(params)}`,
    ),

  adjust: (payload: {
    variant_id: number;
    delta: number;
    reason: AdjustmentReason;
    note?: string;
  }) => api.post<StockAdjustment>("/admin/inventory/adjustments", payload),

  approveAdjustment: (id: number, decisionNote?: string) =>
    api.post<StockAdjustment>(`/admin/inventory/adjustments/${id}/approve`, {
      decision_note: decisionNote,
    }),

  // The note is required on rejection but optional on approval: a refusal that
  // records no reason leaves the requester with nothing to act on.
  rejectAdjustment: (id: number, decisionNote: string) =>
    api.post<StockAdjustment>(`/admin/inventory/adjustments/${id}/reject`, {
      decision_note: decisionNote,
    }),
};
