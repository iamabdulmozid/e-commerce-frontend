import { api } from "@/lib/api";
import type { Paginated } from "@/types/auth";

/*
 * Payments client (Phase 11).
 *
 * Note what is absent: any way to set a payment to `success` directly. The only
 * paths are recording a cash collection and a signature-verified webhook - a
 * browser cannot mark money received, which is engineering rule 4 expressed as
 * a missing method.
 */

export type PaymentGateway = "cod" | "sslcommerz" | "bkash" | "nagad";

export type PaymentState =
  | "initiated"
  | "pending"
  | "success"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "partially_refunded";

export interface PaymentLogRow {
  id: number;
  type: string;
  type_label: string;
  direction: "inbound" | "outbound";
  status: string | null;
  webhook_event_id: string | null;
  signature_valid: boolean | null;
  /** Already scrubbed of card data and credentials server-side. */
  payload: Record<string, unknown> | null;
  error: string | null;
  processed_at: string | null;
  created_at: string | null;
}

export interface Payment {
  id: number;
  gateway: PaymentGateway;
  gateway_label: string;
  status: PaymentState;
  status_label: string;
  amount: string;
  currency: string;
  transaction_id: string | null;
  gateway_reference: string | null;
  requires_action: boolean;
  is_outstanding: boolean;
  paid_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  collected_at: string | null;
  collection_note: string | null;
  collector?: { id: number; name: string } | null;
  order?: { id: number; number: string; email: string } | null;
  created_at: string | null;
  transactions?: PaymentLogRow[];
}

export interface CodReconciliation {
  period: { from: string; to: string };
  totals: {
    outstanding: string;
    collected: string;
    outstanding_count: number;
    collected_count: number;
  };
  by_collector: Record<string, { count: number; amount: string }>;
  outstanding_payments: Payment[];
}

export interface GatewayCatalogEntry {
  gateway: PaymentGateway;
  label: string;
  /** Whether a working driver exists — not whether the merchant enabled it. */
  implemented: boolean;
  is_enabled: boolean;
  mode: "sandbox" | "live";
  /** A boolean, never the credentials themselves. */
  has_credentials: boolean;
  supports_refund: boolean;
  available: boolean;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }

  return search.toString();
}

export const paymentService = {
  list: (
    params: {
      gateway?: PaymentGateway | "";
      status?: PaymentState | "";
      q?: string;
      from?: string;
      to?: string;
      per_page?: number;
    } = {},
  ) => api.get<Paginated<Payment>>(`/admin/payments?${query(params)}`),

  show: (id: number) => api.get<Payment>(`/admin/payments/${id}`),

  /** The only client-side path to a successful COD payment. */
  collect: (id: number, amount: string, note?: string) =>
    api.post<Payment>(`/admin/payments/${id}/collect`, { amount, note }),

  markFailed: (id: number, reason: string) =>
    api.post<Payment>(`/admin/payments/${id}/mark-failed`, { reason }),

  codReconciliation: (params: { from?: string; to?: string } = {}) =>
    api.get<CodReconciliation>(
      `/admin/payments/cod-reconciliation?${query(params)}`,
    ),

  gateways: () =>
    api.get<{ items: GatewayCatalogEntry[] }>(
      "/admin/settings/payment-gateways",
    ),

  updateGateway: (
    gateway: PaymentGateway,
    payload: {
      is_enabled?: boolean;
      mode?: "sandbox" | "live";
      /** Omit a field to leave it unchanged; the API merges rather than replaces. */
      credentials?: Record<string, string>;
    },
  ) =>
    api.patch<{ items: GatewayCatalogEntry[] }>(
      `/admin/settings/payment-gateways/${gateway}`,
      payload,
    ),
};
