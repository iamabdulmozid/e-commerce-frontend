import { api } from "@/lib/api";
import type { Paginated } from "@/types/auth";

export type SubscriptionStatus =
  | "pending"
  | "trialing"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "expired";

export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "void";

export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  status_label: string;
  grants_service: boolean;
  package?: { id: number; name: string; slug: string } | null;
  /** DECIMAL as a string: never parse money into a float. */
  price: string;
  currency: string;
  billing_period: string;
  billing_period_label: string;
  grace_days: number;
  features: Record<string, number | boolean | null>;
  trial_ends_at: string | null;
  starts_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  past_due_at: string | null;
  suspended_at: string | null;
  cancelled_at: string | null;
  ends_at: string | null;
}

export interface UsageLimit {
  feature: string;
  label: string;
  /** null means unlimited. */
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
}

export interface UsageFlag {
  feature: string;
  label: string;
  enabled: boolean;
}

export interface InvoicePayment {
  id: number;
  amount: string;
  currency: string;
  method: string;
  reference: string | null;
  received_at: string;
  note: string | null;
}

export interface Invoice {
  id: number;
  number: string;
  status: InvoiceStatus;
  period_start: string;
  period_end: string;
  currency: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid_amount: string;
  balance: string;
  is_overdue: boolean;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  replaces_invoice_id: number | null;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: string;
    amount: string;
  }>;
  payments?: InvoicePayment[];
}

/**
 * Read-only by design. The platform owns commercial state, so there is no
 * write path here to leave out - the API has none either.
 */
export const billingService = {
  subscription: () => api.get<Subscription | null>("/admin/billing/subscription"),

  usage: () =>
    api.get<{ limits: UsageLimit[]; flags: UsageFlag[] }>(
      "/admin/billing/usage",
    ),

  invoices: (params: { per_page?: number } = {}) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return api.get<Paginated<Invoice>>(`/admin/billing/invoices?${query}`);
  },

  invoice: (id: number) => api.get<Invoice>(`/admin/billing/invoices/${id}`),
};

/** Money arrives as a DECIMAL string; format it without ever going via float. */
export function formatMoney(amount: string, currency: string): string {
  const [whole, fraction = "00"] = amount.split(".");
  const sign = whole.startsWith("-") ? "-" : "";
  const digits = sign ? whole.slice(1) : whole;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${sign}${currency} ${grouped}.${fraction.padEnd(2, "0")}`;
}
