import { api } from "@/lib/api";
import { readCartToken, writeCartToken } from "@/services/cart";

/*
 * Checkout client (Phase 9).
 *
 * The two rules this file exists to honour:
 *
 *   The browser NEVER computes a total. `lines` and `grand_total` are rendered
 *   exactly as the server sent them (engineering rule 2). There is deliberately
 *   no helper here that sums anything.
 *
 *   The idempotency key is generated ONCE per checkout session and reused for
 *   every retry of that submission. Regenerating it on retry silently disables
 *   the exactly-once guarantee - which is the single most tempting mistake in
 *   this file, and why it is a module-level value rather than a call.
 */

export interface TotalsLine {
  code: string;
  label: string;
  amount: string;
  sign: "+" | "-";
}

export interface ShippingMethod {
  code: string;
  label: string;
  amount: string;
  selected: boolean;
}

export interface PaymentMethod {
  code: string;
  label: string;
  available: boolean;
}

export interface CheckoutQuote {
  lines: TotalsLine[];
  grand_total: string;
  currency: string;
  shipping_methods: ShippingMethod[];
  payment_methods: PaymentMethod[];
  issues: string[];
  checkout_ready: boolean;
  quoted_at: string;
}

export interface AddressInput {
  address_id?: number;
  recipient_name?: string;
  phone?: string;
  district?: string;
  area?: string;
  address_line?: string;
  postal_code?: string;
}

export interface CheckoutPayload {
  shipping_address: AddressInput;
  billing_address?: { same_as_shipping?: boolean; address_id?: number };
  shipping_method?: string;
  payment_method?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface PlacedOrder {
  order: {
    number: string;
    status: string;
    status_label: string;
    payment_status: string;
    totals: { grand_total: string; currency: string };
  };
  payment: { method: string; status: string; requires_action: boolean };
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const token = readCartToken();
  return token ? { "X-Cart-Token": token, ...extra } : extra;
}

/*
 * One key for the life of this checkout attempt.
 *
 * Held in a module variable rather than regenerated per call, because the whole
 * protection depends on a RETRY sending the same key. `crypto.randomUUID` is
 * available in every browser this app supports; the fallback keeps server-side
 * rendering from throwing.
 */
let sessionKey: string | null = null;

export function checkoutIdempotencyKey(): string {
  if (sessionKey === null) {
    sessionKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replaceAll("-", "")
        : Math.random().toString(36).slice(2).padEnd(32, "0");
  }

  return sessionKey;
}

/** Start a NEW attempt. Called only after an order is successfully placed. */
export function resetCheckoutKey(): void {
  sessionKey = null;
}

export const checkoutService = {
  /** No side effects; safe to call on every address change. */
  quote: (payload: CheckoutPayload) =>
    api.post<CheckoutQuote>("/checkout/quote", payload, {
      headers: headers(),
    }),

  place: async (
    payload: CheckoutPayload & { expected_total: string },
  ): Promise<PlacedOrder> => {
    const placed = await api.post<PlacedOrder>("/checkout", payload, {
      headers: headers({ "Idempotency-Key": checkoutIdempotencyKey() }),
    });

    // The cart is converted server-side and its token no longer resolves, so
    // holding on to it would 404 the shopper's next page load.
    writeCartToken(null);
    resetCheckoutKey();

    return placed;
  },
};
