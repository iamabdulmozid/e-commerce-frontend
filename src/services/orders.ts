import { api } from "@/lib/api";
import type { Paginated } from "@/types/auth";

/*
 * Orders client (Phase 10).
 *
 * Order status and PAYMENT status are separate fields throughout, and the UI
 * must keep them separate: a COD order that is `shipped` and still `pending`
 * payment is the normal case, not a contradiction.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "payment_failed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "return_approved"
  | "returned"
  | "refund_pending"
  | "refunded";

export type OrderPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refund_due"
  | "partially_refunded"
  | "refunded";

export interface OrderLine {
  product_name: string;
  sku: string;
  variant_label: string | null;
  image_url: string | null;
  unit_price: string;
  base_price: string;
  quantity: number;
  total: string;
}

export interface OrderTotals {
  subtotal: string;
  discount_total: string;
  coupon_discount: string;
  tax_total: string;
  shipping_total: string;
  round_off: string;
  grand_total: string;
  currency: string;
}

export interface OrderAddress {
  recipient_name: string | null;
  phone: string | null;
  district: string | null;
  area: string | null;
  address_line: string | null;
  postal_code: string | null;
}

export interface Order {
  number: string;
  status: OrderStatus;
  status_label: string;
  payment_status: OrderPaymentStatus;
  payment_status_label: string;
  placed_at: string;
  items?: OrderLine[];
  totals: OrderTotals;
  shipping_address: OrderAddress;
  shipping_method: string | null;
  customer_note: string | null;

  /** Customer shape only: milestones, never the internal history. */
  timeline?: { status: string; label: string; at: string }[];
  can_cancel?: boolean;

  /** Staff shape only. */
  id?: number;
  email?: string;
  phone?: string | null;
  billing_address?: OrderAddress;
  staff_note?: string | null;
  cancel_reason?: string | null;
  /** Set once the order's holds became sales - drives the cancel warning. */
  stock_consumed_at?: string | null;
  customer?: { id: number; name: string; email: string } | null;
  history?: {
    from: string | null;
    to: string;
    to_label: string;
    actor_type: string;
    actor: string | null;
    note: string | null;
    at: string;
  }[];
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }

  return search.toString();
}

export const orderService = {
  mine: (params: { status?: string; page?: number } = {}) =>
    api.get<Paginated<Order>>(`/orders?${query(params)}`),

  show: (number: string) => api.get<Order>(`/orders/${number}`),

  cancel: (number: string, reason: string) =>
    api.post<Order>(`/orders/${number}/cancel`, { reason }),

  /** Guest lookup needs BOTH the number and the email it was placed with. */
  lookup: (number: string, email: string) =>
    api.post<Order>("/orders/lookup", { number, email }),

  admin: {
    list: (
      params: {
        status?: string;
        payment_status?: string;
        q?: string;
        open?: string;
        sort?: string;
        page?: number;
        per_page?: number;
      } = {},
    ) => api.get<Paginated<Order>>(`/admin/orders?${query(params)}`),

    show: (number: string) => api.get<Order>(`/admin/orders/${number}`),

    /**
     * What the state machine allows right now.
     *
     * Fetched rather than hardcoded: a client carrying its own copy of the
     * transition table drifts from the server's the first time a phase touches
     * it, and then offers moves that 409.
     */
    transitions: (number: string) =>
      api.get<{
        current: OrderStatus;
        allowed: { value: OrderStatus; label: string }[];
      }>(`/admin/orders/${number}/transitions`),

    updateStatus: (number: string, status: OrderStatus, note?: string) =>
      api.post<Order>(`/admin/orders/${number}/status`, { status, note }),

    cancel: (number: string, reason: string) =>
      api.post<Order>(`/admin/orders/${number}/cancel`, { reason }),

    addNote: (number: string, note: string) =>
      api.post<Order>(`/admin/orders/${number}/notes`, { note }),
  },
};
