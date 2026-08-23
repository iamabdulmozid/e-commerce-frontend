"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import {
  platformService,
  type FeatureCatalog,
  type Package,
} from "@/services/platform";

/**
 * Create or edit a package.
 *
 * The feature inputs are driven by the catalog the API sends rather than
 * hard-coded here: adding a feature is a change to config/features.php on the
 * backend, and this form picks it up without a frontend release.
 *
 * An empty limit means unlimited, which is why these are text inputs rather
 * than numbers with a zero default - zero means "switched off" and is a
 * genuinely different thing.
 */
export function PackageEditor({
  pkg,
  catalog,
  onClose,
  onSaved,
}: {
  pkg: Package | null;
  catalog: FeatureCatalog;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    name: pkg?.name ?? "",
    description: pkg?.description ?? "",
    price: pkg?.price ?? "0.00",
    billing_period: pkg?.billing_period ?? "monthly",
    trial_days: String(pkg?.trial_days ?? 0),
    grace_days: String(pkg?.grace_days ?? 7),
    is_public: pkg?.is_public ?? true,
  }));

  const [features, setFeatures] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};

    for (const limit of catalog.limits) {
      const value = pkg?.features[limit.feature] ?? limit.default;
      initial[limit.feature] = value === null || value === undefined ? "" : String(value);
    }

    for (const flag of catalog.flags) {
      initial[flag.feature] = Boolean(pkg?.features[flag.feature] ?? flag.default);
    }

    return initial;
  });

  async function save() {
    setError(null);
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: form.price,
      billing_period: form.billing_period,
      trial_days: Number(form.trial_days || 0),
      grace_days: Number(form.grace_days || 0),
      is_public: form.is_public,
      features: Object.fromEntries(
        Object.entries(features).map(([key, value]) => [
          key,
          // An empty limit is unlimited (null), not zero.
          typeof value === "boolean" ? value : value === "" ? null : Number(value),
        ]),
      ),
    };

    try {
      if (pkg) {
        await platformService.updatePackage(pkg.id, payload as Partial<Package>);
      } else {
        await platformService.createPackage(payload as Partial<Package>);
      }

      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError("Something went wrong", 0));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <CardTitle>{pkg ? `Edit ${pkg.name}` : "New package"}</CardTitle>
        <CardDescription>
          Changes apply to future sales. Existing subscriptions keep the terms they were
          sold unless you resync them explicitly.
        </CardDescription>
      </div>

      {error && <FormAlert message={error.displayMessage} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={error?.fieldError("name")}
          required
        />
        <Field
          label="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          error={error?.fieldError("price")}
          inputMode="decimal"
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="billing_period" className="block text-sm font-medium">
            Billing period
          </label>
          <select
            id="billing_period"
            value={form.billing_period}
            onChange={(e) => setForm({ ...form, billing_period: e.target.value })}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <Field
          label="Trial days"
          type="number"
          min={0}
          value={form.trial_days}
          onChange={(e) => setForm({ ...form, trial_days: e.target.value })}
        />
        <Field
          label="Grace days"
          type="number"
          min={0}
          value={form.grace_days}
          onChange={(e) => setForm({ ...form, grace_days: e.target.value })}
        />
        <Field
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Limits</h3>
        <p className="text-muted-foreground mb-3 text-xs">
          Leave blank for unlimited. Zero switches the feature off entirely.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {catalog.limits.map((limit) => (
            <Field
              key={limit.feature}
              label={limit.label}
              value={String(features[limit.feature] ?? "")}
              onChange={(e) =>
                setFeatures({ ...features, [limit.feature]: e.target.value })
              }
              error={error?.fieldError(`features.${limit.feature}`)}
              inputMode="numeric"
              placeholder="unlimited"
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Features</h3>

        <div className="grid gap-2 sm:grid-cols-2">
          {catalog.flags.map((flag) => (
            <label key={flag.feature} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(features[flag.feature])}
                onChange={(e) =>
                  setFeatures({ ...features, [flag.feature]: e.target.checked })
                }
              />
              {flag.label}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
        />
        Offer publicly
      </label>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving} disabled={!form.name}>
          {pkg ? "Save changes" : "Create package"}
        </Button>
      </div>
    </Card>
  );
}
