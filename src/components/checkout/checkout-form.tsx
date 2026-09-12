"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/auth/auth-provider";
import { CheckoutTotals } from "@/components/checkout/checkout-totals";
import { refreshCart, useCart } from "@/components/cart/use-cart";
import { formatMoney } from "@/components/catalog/price";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  checkoutService,
  type AddressInput,
  type CheckoutPayload,
  type CheckoutQuote,
} from "@/services/checkout";
import { addressService } from "@/services/customer";
import type { Address } from "@/types/customer";

/**
 * One page, three sections - not a wizard with URLs.
 *
 * A URL per step invites deep links into a half-built checkout and doubles the
 * state-restoration work. Keeping it on one page also keeps the re-quote loop
 * local: changing an address or a method re-quotes in place.
 *
 * The totals panel renders `data.lines` AS GIVEN. It never adds, re-labels or
 * hides a zero line it thinks is uninteresting - that is the structural
 * guarantee that the figure on screen is the figure the server computed
 * (engineering rule 2).
 */
export function CheckoutForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();

  const [address, setAddress] = useState<AddressInput>({});
  const [savedAddressId, setSavedAddressId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("standard");

  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<string | null>(null);

  const { data: districts } = useSWR(
    "/districts",
    async () => (await addressService.districts()).items,
  );

  const { data: savedAddresses } = useSWR(
    user ? "/me/addresses" : null,
    async () => (await addressService.list()).items,
  );

  const payload = useMemo<CheckoutPayload>(
    () => ({
      shipping_address:
        savedAddressId !== null ? { address_id: savedAddressId } : address,
      billing_address: { same_as_shipping: true },
      shipping_method: method,
      payment_method: "cod",
      email: user ? undefined : email || undefined,
      notes: notes || undefined,
    }),
    [savedAddressId, address, method, email, notes, user],
  );

  const addressComplete =
    savedAddressId !== null ||
    Boolean(
      address.recipient_name &&
      address.phone &&
      address.district &&
      address.area &&
      address.address_line,
    );

  /*
   * Re-quote whenever anything that affects the price changes.
   *
   * Debounced, and the panel keeps its previous figures while a new quote is in
   * flight - jumping to zero and back on every keystroke reads as a broken
   * page.
   */
  const requote = useCallback(async () => {
    if (!cart || cart.items.length === 0) return;

    setQuoting(true);
    setError(null);

    try {
      setQuote(await checkoutService.quote(payload));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status !== 422) {
        setError(caught.displayMessage);
      }
    } finally {
      setQuoting(false);
    }
  }, [cart, payload]);

  useEffect(() => {
    const timer = window.setTimeout(() => void requote(), 300);
    return () => window.clearTimeout(timer);
  }, [requote]);

  async function place() {
    if (!quote) return;

    setPlacing(true);
    setError(null);
    setMismatch(null);

    try {
      const placed = await checkoutService.place({
        ...payload,
        // A CHECK, never an input: the server compares it and re-computes the
        // real figure regardless.
        expected_total: quote.grand_total,
      });

      await refreshCart();

      router.push(`/checkout/success?order=${placed.order.number}`);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "total_mismatch") {
        // Re-quote in place and show what changed, rather than failing
        // outright - the shopper can accept the new figure in one click.
        const data = caught.data as { expected: string; actual: string };
        setMismatch(data.actual);
        await requote();
      } else if (
        caught instanceof ApiError &&
        caught.code === "insufficient_stock"
      ) {
        setError("Some items sold out while you were checking out.");
        await refreshCart();
      } else {
        setError(
          caught instanceof ApiError
            ? caught.displayMessage
            : "Could not place your order.",
        );
      }
    } finally {
      setPlacing(false);
    }
  }

  if (cartLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Card className="mt-6 space-y-3 text-center">
        <p>Your bag is empty, so there is nothing to check out.</p>
        <ButtonLink href="/products">Browse the shop</ButtonLink>
      </Card>
    );
  }

  const currency = cart.summary.currency;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="space-y-6">
        {/* 1 — Delivery */}
        <Card className="space-y-4">
          <CardTitle>Delivery address</CardTitle>

          {user && savedAddresses && savedAddresses.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {savedAddresses.map((saved: Address) => (
                <button
                  key={saved.id}
                  type="button"
                  onClick={() => setSavedAddressId(saved.id)}
                  className={`rounded-lg border p-3 text-left text-sm ${
                    savedAddressId === saved.id
                      ? "border-primary bg-primary-soft"
                      : "border-border"
                  }`}
                >
                  <span className="font-medium">{saved.recipient_name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {saved.address_line}, {saved.area}, {saved.district}
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSavedAddressId(null)}
                className={`rounded-lg border border-dashed p-3 text-left text-sm ${
                  savedAddressId === null ? "border-primary" : "border-border"
                }`}
              >
                Use a different address
              </button>
            </div>
          )}

          {savedAddressId === null && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                name="recipient_name"
                required
                value={address.recipient_name ?? ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, recipient_name: e.target.value }))
                }
              />
              <Field
                label="Phone"
                name="phone"
                required
                inputMode="tel"
                hint="The courier will call this number."
                value={address.phone ?? ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, phone: e.target.value }))
                }
              />

              <div className="space-y-1.5">
                <label htmlFor="district" className="text-sm font-medium">
                  District
                </label>
                <select
                  id="district"
                  value={address.district ?? ""}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, district: e.target.value }))
                  }
                  className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">Choose a district…</option>
                  {districts?.map((d: string) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label="Area"
                name="area"
                required
                hint="Thana, upazila or neighbourhood"
                value={address.area ?? ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, area: e.target.value }))
                }
              />

              <Field
                label="Address"
                name="address_line"
                required
                className="sm:col-span-2"
                value={address.address_line ?? ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, address_line: e.target.value }))
                }
              />

              <Field
                label="Postcode"
                name="postal_code"
                value={address.postal_code ?? ""}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, postal_code: e.target.value }))
                }
              />
            </div>
          )}

          {!user && (
            <Field
              label="Email"
              name="email"
              type="email"
              required
              hint="We will send your order confirmation here."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Card>

        {/* 2 — Delivery method and payment */}
        <Card className="space-y-4">
          <CardTitle>Delivery &amp; payment</CardTitle>

          <div className="space-y-2">
            {quote?.shipping_methods.map((option) => (
              <label
                key={option.code}
                className="border-border flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
              >
                <input
                  type="radio"
                  name="shipping_method"
                  checked={method === option.code}
                  onChange={() => setMethod(option.code)}
                />
                <span className="flex-1">{option.label}</span>
                <span className="tabular-nums">
                  {formatMoney(option.amount, currency)}
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            {quote?.payment_methods.map((option) => (
              <label
                key={option.code}
                className="border-border flex items-center gap-3 rounded-lg border p-3 text-sm"
              >
                <input type="radio" name="payment_method" checked readOnly />
                <span className="flex-1">{option.label}</span>
                <span className="text-muted-foreground text-xs">
                  Pay when your order arrives
                </span>
              </label>
            ))}
          </div>

          <Field
            label="Order notes"
            name="notes"
            hint="Optional — a landmark, or a time that suits you."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>
      </div>

      {/* 3 — Review */}
      <Card className="space-y-4 lg:sticky lg:top-24">
        <CardTitle>Your order</CardTitle>

        <ul className="divide-border divide-y text-sm">
          {cart.items.map((line) => (
            <li key={line.id} className="flex justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="line-clamp-2-safe">
                  {line.variant?.product?.name}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {line.variant?.label ? `${line.variant.label} · ` : ""}
                  Qty {line.quantity}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMoney(line.line_total, currency)}
              </span>
            </li>
          ))}
        </ul>

        <CheckoutTotals quote={quote} currency={currency} pending={quoting} />

        {mismatch && (
          <div className="bg-warning-soft text-warning-foreground rounded-lg p-3 text-sm">
            The total changed to {formatMoney(mismatch, currency)} while you
            were checking out. Review it above and place your order again.
          </div>
        )}

        {error && <FormAlert message={error} />}

        <Button
          size="lg"
          className="w-full"
          disabled={
            placing ||
            quoting ||
            !addressComplete ||
            !quote?.checkout_ready ||
            (!user && !email)
          }
          onClick={() => void place()}
        >
          {placing ? "Placing your order…" : "Place order"}
        </Button>

        {!addressComplete && (
          <p className="text-muted-foreground text-center text-xs">
            Fill in your delivery address to continue.
          </p>
        )}

        {addressComplete && quote && !quote.checkout_ready && (
          <p className="text-muted-foreground text-center text-xs">
            Your bag needs attention before you can check out.{" "}
            <a href="/cart" className="underline">
              Review it
            </a>
          </p>
        )}
      </Card>
    </div>
  );
}
