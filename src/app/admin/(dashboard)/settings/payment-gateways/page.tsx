"use client";

import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  paymentService,
  type GatewayCatalogEntry,
  type PaymentGateway,
} from "@/services/payments";

/**
 * Per-store gateway credentials.
 *
 * Two rules this screen exists to honour visibly.
 *
 * It never displays a stored secret — the API has no endpoint that could return
 * one. A saved key shows as "saved" and nothing more, so the merchant can tell
 * something is there without the value ever reaching a browser.
 *
 * A gateway whose driver is still a stub shows as "Coming soon" and cannot be
 * enabled. Accepting credentials for something that will not work is a slower,
 * more confusing version of not offering it.
 */
const CREDENTIAL_FIELDS: Record<
  PaymentGateway,
  { key: string; label: string }[]
> = {
  cod: [],
  sslcommerz: [
    { key: "store_id", label: "Store ID" },
    { key: "store_passwd", label: "Store password" },
  ],
  bkash: [
    { key: "app_key", label: "App key" },
    { key: "app_secret", label: "App secret" },
    { key: "username", label: "Username" },
    { key: "password", label: "Password" },
  ],
  nagad: [
    { key: "merchant_id", label: "Merchant ID" },
    { key: "merchant_private_key", label: "Merchant private key" },
    { key: "nagad_public_key", label: "Nagad public key" },
  ],
};

export default function PaymentGatewaysPage() {
  const { data, isLoading, mutate } = useSWR(
    "/admin/settings/payment-gateways",
    async () => (await paymentService.gateways()).items,
  );

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Payment methods</h1>
        <p className="text-muted-foreground text-sm">
          Credentials are encrypted and belong to this store alone. Saved keys
          are never shown again.
        </p>
      </div>

      <div className="space-y-4">
        {data?.map((gateway) => (
          <GatewayCard
            key={gateway.gateway}
            gateway={gateway}
            onSaved={() => void mutate()}
          />
        ))}
      </div>
    </div>
  );
}

function GatewayCard({
  gateway,
  onSaved,
}: {
  gateway: GatewayCatalogEntry;
  onSaved: () => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fields = CREDENTIAL_FIELDS[gateway.gateway];

  async function save(
    payload: Parameters<typeof paymentService.updateGateway>[1],
  ) {
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      await paymentService.updateGateway(gateway.gateway, payload);
      setCredentials({});
      setSaved(true);
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.displayMessage : "Could not save.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>{gateway.label}</CardTitle>
          <CardDescription>
            {gateway.gateway === "cod"
              ? "Customers pay the courier in cash. No credentials needed."
              : gateway.implemented
                ? "Live gateway integration."
                : "Integration not built yet — credentials can be saved in advance."}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {gateway.has_credentials && (
            <Badge tone="outline" size="sm">
              Keys saved
            </Badge>
          )}

          {gateway.available ? (
            <Badge tone="success" size="sm">
              Active
            </Badge>
          ) : gateway.implemented ? (
            <Badge tone="neutral" size="sm">
              Off
            </Badge>
          ) : (
            <Badge tone="warning" size="sm">
              Coming soon
            </Badge>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              name={`${gateway.gateway}-${field.key}`}
              type="password"
              autoComplete="off"
              placeholder={
                gateway.has_credentials ? "Saved — leave blank to keep" : ""
              }
              hint={
                gateway.has_credentials
                  ? "Leave blank to keep the saved value."
                  : undefined
              }
              value={credentials[field.key] ?? ""}
              onChange={(e) =>
                setCredentials((c) => ({ ...c, [field.key]: e.target.value }))
              }
            />
          ))}
        </div>
      )}

      {error && <FormAlert message={error} />}
      {saved && <p className="text-success text-sm">Saved.</p>}

      <div className="flex flex-wrap items-center gap-2">
        {fields.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || Object.keys(credentials).length === 0}
            onClick={() => void save({ credentials })}
          >
            Save keys
          </Button>
        )}

        {/* Enabling is blocked while the driver is a stub: an option that
            fails after the shopper picks it is worse than one never offered. */}
        <Button
          size="sm"
          variant={gateway.is_enabled ? "outline" : "primary"}
          disabled={busy || !gateway.implemented}
          onClick={() => void save({ is_enabled: !gateway.is_enabled })}
        >
          {gateway.is_enabled ? "Turn off" : "Turn on"}
        </Button>

        {gateway.implemented && gateway.gateway !== "cod" && (
          <select
            value={gateway.mode}
            disabled={busy}
            onChange={(e) =>
              void save({ mode: e.target.value as "sandbox" | "live" })
            }
            aria-label={`${gateway.label} mode`}
            className="border-input bg-background ml-auto h-8 rounded-md border px-2 text-sm"
          >
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        )}
      </div>
    </Card>
  );
}
