"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  billingService,
  formatMoney,
  type Invoice,
  type InvoiceStatus,
} from "@/services/billing";

export default function AdminInvoicesPage() {
  const [openId, setOpenId] = useState<number | null>(null);

  const {
    data: invoices,
    isLoading,
    error,
  } = useSWR(
    "/admin/billing/invoices",
    async () => (await billingService.invoices({ per_page: 50 })).items,
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/billing" className="text-muted-foreground text-sm underline">
          Back to billing
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Invoices</h1>
        <p className="text-muted-foreground text-sm">
          What the platform has billed this store, and what has been received.
        </p>
      </div>

      {error != null && (
        <FormAlert
          message={
            error instanceof ApiError ? error.message : "Failed to load invoices"
          }
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-6">
                  Loading…
                </td>
              </tr>
            )}

            {invoices?.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-6">
                  No invoices yet.
                </td>
              </tr>
            )}

            {invoices?.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  {invoice.number}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {invoice.period_start} — {invoice.period_end}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {invoice.due_at
                    ? new Date(invoice.due_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                  {formatMoney(invoice.total, invoice.currency)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 tabular-nums whitespace-nowrap",
                    invoice.is_overdue && "text-destructive font-medium",
                  )}
                >
                  {formatMoney(invoice.balance, invoice.currency)}
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge
                    status={invoice.status}
                    overdue={invoice.is_overdue}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setOpenId(openId === invoice.id ? null : invoice.id)
                    }
                    className="text-sm underline"
                  >
                    {openId === invoice.id ? "Hide" : "Details"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {openId != null && <InvoiceDetail id={openId} />}
    </div>
  );
}

function InvoiceDetail({ id }: { id: number }) {
  const { data: invoice, isLoading } = useSWR(
    `/admin/billing/invoices/${id}`,
    () => billingService.invoice(id),
    { shouldRetryOnError: false },
  );

  if (isLoading) return <Card className="p-6 text-sm">Loading…</Card>;
  if (!invoice) return null;

  return (
    <Card className="space-y-5 p-6">
      <h2 className="font-semibold">{invoice.number}</h2>

      <div>
        <h3 className="mb-2 text-sm font-medium">Line items</h3>
        <ul className="divide-y text-sm">
          {invoice.line_items?.map((item, index) => (
            <li key={index} className="flex justify-between gap-4 py-2">
              <span>{item.description}</span>
              <span className="tabular-nums whitespace-nowrap">
                {formatMoney(item.amount, invoice.currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Payments</h3>
        {invoice.payments?.length ? (
          <ul className="divide-y text-sm">
            {invoice.payments.map((payment) => (
              <li key={payment.id} className="flex justify-between gap-4 py-2">
                <span>
                  {new Date(payment.received_at).toLocaleDateString()} ·{" "}
                  {payment.method.replace("_", " ")}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </span>
                <span className="tabular-nums whitespace-nowrap">
                  {formatMoney(payment.amount, invoice.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Nothing received yet.</p>
        )}
      </div>

      <div className="flex justify-between border-t pt-3 text-sm font-medium">
        <span>Balance</span>
        <span className="tabular-nums">
          {formatMoney(invoice.balance, invoice.currency)}
        </span>
      </div>
    </Card>
  );
}

function InvoiceStatusBadge({
  status,
  overdue,
}: {
  status: InvoiceStatus;
  overdue: boolean;
}) {
  const label = overdue && status !== "paid" ? "overdue" : status;

  const tone =
    label === "paid"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : label === "overdue"
        ? "bg-destructive/15 text-destructive"
        : label === "void"
          ? "bg-muted text-muted-foreground"
          : "bg-sky-500/15 text-sky-700 dark:text-sky-400";

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tone)}>
      {label}
    </span>
  );
}

export type { Invoice };
