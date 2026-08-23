"use client";

import { useState } from "react";
import useSWR from "swr";
import { usePlatformAuth } from "@/components/platform/platform-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatMoney, type Invoice } from "@/services/billing";
import { canPlatform, platformService } from "@/services/platform";

const METHODS = ["bank_transfer", "bkash", "nagad", "cash", "adjustment"];

export default function PlatformInvoicesPage() {
  const { user } = usePlatformAuth();
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; message: string } | null>(
    null,
  );

  const { data, mutate, isLoading, error } = useSWR(
    ["/platform/invoices", outstandingOnly],
    async () => (await platformService.invoices({ outstanding: outstandingOnly })).items,
    { shouldRetryOnError: false },
  );

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice(null);

    try {
      await action();
      await mutate();
      setNotice({ tone: "success", message: success });
    } catch (e) {
      setNotice({
        tone: "error",
        message: e instanceof ApiError ? e.displayMessage : "Something went wrong",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm">
            What tenants owe the platform, and what has been received.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={outstandingOnly}
            onChange={(e) => setOutstandingOnly(e.target.checked)}
          />
          Outstanding only
        </label>
      </div>

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.message : "Failed to load invoices"}
        />
      )}
      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  Loading…
                </td>
              </tr>
            )}

            {data?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  No invoices.
                </td>
              </tr>
            )}

            {data?.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{invoice.number}</td>
                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                  {invoice.period_start} — {invoice.period_end}
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
                <td className="px-4 py-3">{invoice.status}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="underline"
                    onClick={() => setOpenId(openId === invoice.id ? null : invoice.id)}
                  >
                    {openId === invoice.id ? "Hide" : "Manage"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {openId != null && data && (
        <InvoicePanel
          invoice={data.find((i) => i.id === openId)!}
          canManage={canPlatform(user, "invoice.manage")}
          canRecord={canPlatform(user, "payment.record")}
          onRun={run}
        />
      )}
    </div>
  );
}

function InvoicePanel({
  invoice,
  canManage,
  canRecord,
  onRun,
}: {
  invoice: Invoice;
  canManage: boolean;
  canRecord: boolean;
  onRun: (action: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const [voidReason, setVoidReason] = useState("");
  const [amount, setAmount] = useState(invoice.balance);
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");

  return (
    <Card className="space-y-5">
      <CardTitle>{invoice.number}</CardTitle>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <Row label="Total" value={formatMoney(invoice.total, invoice.currency)} />
        <Row label="Received" value={formatMoney(invoice.paid_amount, invoice.currency)} />
        <Row label="Balance" value={formatMoney(invoice.balance, invoice.currency)} />
        <Row
          label="Due"
          value={invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : "—"}
        />
      </dl>

      {canManage && invoice.status === "draft" && (
        <div className="flex gap-2 border-t pt-4">
          <Button onClick={() => onRun(() => platformService.issueInvoice(invoice.id), "Invoice issued")}>
            Issue
          </Button>
        </div>
      )}

      {canRecord && (invoice.status === "issued" || invoice.status === "overdue") && (
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-medium">Record a payment</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />

            <div className="space-y-1.5">
              <label htmlFor="method" className="block text-sm font-medium">
                Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <Button
            onClick={() =>
              onRun(
                () =>
                  platformService.recordPayment(invoice.id, {
                    amount,
                    method,
                    reference: reference || undefined,
                  }),
                "Payment recorded",
              )
            }
          >
            Record payment
          </Button>
        </div>
      )}

      {canManage && invoice.status !== "paid" && invoice.status !== "void" && (
        <div className="space-y-2 border-t pt-4">
          <Field
            label="Void this invoice"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="Reason (required)"
          />
          <p className="text-muted-foreground text-xs">
            An issued invoice cannot be edited. Void it and issue a replacement.
          </p>
          <Button
            variant="destructive"
            disabled={!voidReason}
            onClick={() =>
              onRun(() => platformService.voidInvoice(invoice.id, voidReason), "Invoice voided")
            }
          >
            Void
          </Button>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
