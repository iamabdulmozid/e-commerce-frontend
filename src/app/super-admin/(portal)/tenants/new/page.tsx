"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { tenantHostname, tenantOrigin } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/services/billing";
import { platformService, type Package, type Tenant } from "@/services/platform";

/*
 * The create-tenant wizard.
 *
 * Four steps, one submit at the end. Splitting the submit would leave a
 * half-created tenant behind if the operator wandered off, and the API is
 * built to take the whole thing at once.
 */

type Step = "store" | "package" | "admin" | "review";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "store", label: "Store" },
  { id: "package", label: "Package" },
  { id: "admin", label: "Admin" },
  { id: "review", label: "Review" },
];

interface Draft {
  name: string;
  slug: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  packageId: number | null;
  trialDays: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  invite: boolean;
}

const EMPTY: Draft = {
  name: "",
  slug: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  packageId: null,
  trialDays: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  invite: false,
};

export default function NewTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("store");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Tenant | null>(null);

  // The catalogue cannot change during a two-minute wizard, and refetching it
  // every time the operator tabs away and back is pure noise.
  const { data: packagesData } = useSWR(
    "/platform/packages",
    () => platformService.packages(),
    { revalidateOnFocus: false, revalidateIfStale: false },
  );

  const packages = packagesData?.items.filter((p) => p.is_active) ?? [];
  const selected = packages.find((p) => p.id === draft.packageId) ?? null;

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError(null);
    setSubmitting(true);

    try {
      const tenant = await platformService.createTenant({
        name: draft.name,
        slug: draft.slug,
        contact_name: draft.contactName || undefined,
        contact_email: draft.contactEmail || undefined,
        contact_phone: draft.contactPhone || undefined,
        admin: {
          name: draft.adminName,
          email: draft.adminEmail,
          // Exactly one of the two, which the API also insists on.
          password: draft.invite ? null : draft.adminPassword,
          invite: draft.invite,
        },
      });

      // Assigning the package is a second call: creation returns 202 and the
      // store is still building, but the subscription is central-only and can
      // be attached straight away.
      if (draft.packageId) {
        await platformService.assignPackage(tenant.id, {
          package_id: draft.packageId,
          trial_days: draft.trialDays ? Number(draft.trialDays) : undefined,
        });
      }

      setCreated(tenant);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError("Something went wrong", 0));
      // Send the operator back to the step that owns the failed field.
      if (e instanceof ApiError) {
        if (e.fieldError("slug") || e.fieldError("name")) setStep("store");
        else if (e.fieldError("admin.password") || e.fieldError("admin.email"))
          setStep("admin");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return <ProvisioningPanel tenant={created} onDone={() => router.push("/super-admin/tenants")} />;
  }

  const index = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/super-admin/tenants" className="text-muted-foreground text-sm underline">
          Back to tenants
        </Link>
        <h1 className="mt-1 text-2xl font-bold">New tenant</h1>
      </div>

      <ol className="flex gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "rounded-full border px-3 py-1",
              i === index && "bg-accent font-medium",
              i < index && "text-muted-foreground",
              i > index && "text-muted-foreground/60",
            )}
          >
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      {error && (
        <FormAlert
          message={
            error.fieldError("slug") ??
            error.fieldError("admin.password") ??
            error.fieldError("admin.email") ??
            error.displayMessage
          }
        />
      )}

      <Card className="space-y-5">
        {step === "store" && (
          <>
            <div className="space-y-1">
              <CardTitle>Store</CardTitle>
              <CardDescription>
                The subdomain is the store&apos;s address. It also names the
                store&apos;s database, so it cannot be changed later.
              </CardDescription>
            </div>

            {/*
             * The store name never writes to the subdomain. Two stores may
             * legitimately share a name, and deriving the address from it made
             * that collide on an unexplained "already taken" (PRD 3C rule 21).
             */}
            <Field
              label="Store name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />

            <div>
              <Field
                label="Subdomain"
                value={draft.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                error={error?.fieldError("slug")}
                required
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {draft.slug ? tenantHostname(draft.slug) : "subdomain preview"}
                {" · "}
                Some names are reserved by the platform.
              </p>
            </div>

            <Field
              label="Contact name"
              value={draft.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
            <Field
              label="Contact email"
              type="email"
              value={draft.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
            <Field
              label="Contact phone"
              value={draft.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
            />
          </>
        )}

        {step === "package" && (
          <>
            <div className="space-y-1">
              <CardTitle>Package</CardTitle>
              <CardDescription>
                What this store is sold. Optional — a tenant can be provisioned now and
                sold a plan later.
              </CardDescription>
            </div>

            <div className="space-y-2">
              {packages.map((pkg) => (
                <PackageOption
                  key={pkg.id}
                  pkg={pkg}
                  selected={draft.packageId === pkg.id}
                  onSelect={() => {
                    set("packageId", pkg.id);
                    set("trialDays", String(pkg.trial_days));
                  }}
                />
              ))}

              <button
                type="button"
                onClick={() => set("packageId", null)}
                className={cn(
                  "w-full rounded-md border p-3 text-left text-sm",
                  draft.packageId === null && "border-primary bg-accent",
                )}
              >
                No plan for now
              </button>
            </div>

            {selected && (
              <Field
                label="Trial days"
                type="number"
                min={0}
                value={draft.trialDays}
                onChange={(e) => set("trialDays", e.target.value)}
              />
            )}
          </>
        )}

        {step === "admin" && (
          <>
            <div className="space-y-1">
              <CardTitle>First store admin</CardTitle>
              <CardDescription>
                The account the merchant signs in with. Give them a password, or send a
                setup link so they choose their own.
              </CardDescription>
            </div>

            <Field
              label="Name"
              value={draft.adminName}
              onChange={(e) => set("adminName", e.target.value)}
              required
            />
            <Field
              label="Email"
              type="email"
              value={draft.adminEmail}
              onChange={(e) => set("adminEmail", e.target.value)}
              error={error?.fieldError("admin.email")}
              required
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.invite}
                onChange={(e) => {
                  set("invite", e.target.checked);
                  if (e.target.checked) set("adminPassword", "");
                }}
              />
              Send a setup link instead of setting a password
            </label>

            {!draft.invite && (
              <div>
                <Field
                  label="Password"
                  type="password"
                  value={draft.adminPassword}
                  onChange={(e) => set("adminPassword", e.target.value)}
                  error={error?.fieldError("admin.password")}
                  autoComplete="new-password"
                  required
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {PASSWORD_HINT}
                </p>
              </div>
            )}
          </>
        )}

        {step === "review" && (
          <>
            <div className="space-y-1">
              <CardTitle>Review</CardTitle>
              <CardDescription>Check it, then create the store.</CardDescription>
            </div>

            <dl className="space-y-2 text-sm">
              <Row label="Store" value={draft.name} />
              <Row label="Address" value={tenantHostname(draft.slug)} />
              <Row label="Package" value={selected?.name ?? "No plan"} />
              {selected && (
                <Row
                  label="Price"
                  value={`${formatMoney(selected.price, selected.currency)} · ${selected.billing_period_label}`}
                />
              )}
              {selected && draft.trialDays !== "0" && draft.trialDays !== "" && (
                <Row label="Trial" value={`${draft.trialDays} days`} />
              )}
              <Row label="Admin" value={`${draft.adminName} · ${draft.adminEmail}`} />
              <Row
                label="Credential"
                value={draft.invite ? "Setup link" : "Password set by you"}
              />
            </dl>
          </>
        )}

        <div className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => setStep(STEPS[Math.max(0, index - 1)].id)}
            disabled={index === 0}
          >
            Back
          </Button>

          {step === "review" ? (
            <Button onClick={submit} loading={submitting}>
              Create tenant
            </Button>
          ) : (
            <Button
              onClick={() => setStep(STEPS[index + 1].id)}
              disabled={!canAdvance(step, draft)}
            >
              Continue
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function canAdvance(step: Step, draft: Draft): boolean {
  if (step === "store") return draft.name.length > 0 && draft.slug.length >= 3;
  if (step === "admin") {
    return (
      draft.adminName.length > 0 &&
      draft.adminEmail.length > 0 &&
      (draft.invite || isPasswordAcceptable(draft.adminPassword))
    );
  }

  return true;
}

/**
 * Mirrors Password::defaults() in AppServiceProvider — length only, no
 * composition rules. Kept in step deliberately: if this drifts stricter than
 * the API the operator is blocked for no reason, and if it drifts looser they
 * reach Review with a password the API will reject.
 */
const PASSWORD_HINT = "At least 8 characters.";

function isPasswordAcceptable(value: string): boolean {
  return value.length >= 8;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function PackageOption({
  pkg,
  selected,
  onSelect,
}: {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-md border p-3 text-left",
        selected && "border-primary bg-accent",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium">{pkg.name}</span>
        <span className="text-sm tabular-nums">
          {formatMoney(pkg.price, pkg.currency)} / {pkg.billing_period_label.toLowerCase()}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {Object.entries(pkg.features)
          .filter(([, value]) => typeof value === "number" || value === null)
          .slice(0, 4)
          .map(([key, value]) => `${key.replace("_", " ")}: ${value ?? "unlimited"}`)
          .join(" · ")}
      </p>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

/**
 * Creation returns 202 and the database is still being built, so the wizard
 * polls until the tenant leaves `provisioning` rather than pretending it is
 * ready.
 */
function ProvisioningPanel({ tenant, onDone }: { tenant: Tenant; onDone: () => void }) {
  const { data: current } = useSWR(
    `/platform/tenants/${tenant.id}`,
    () => platformService.tenant(tenant.id),
    {
      fallbackData: tenant,
      // Poll only while there is something to wait for. An unconditional
      // interval kept hitting the API forever once the tenant went active —
      // and indefinitely when it never left `provisioning` at all.
      refreshInterval: (latest) =>
        latest?.status === "provisioning" ? 2000 : 0,
    },
  );

  const status = current?.status ?? tenant.status;
  const [retrying, setRetrying] = useState(false);
  const [stalled, setStalled] = useState(false);

  // Provisioning is a queued job. If it has not been picked up well past the
  // few seconds it takes, the worker is almost certainly not running — say so,
  // rather than spinning a progress panel at the operator indefinitely.
  useEffect(() => {
    if (status !== "provisioning") {
      return;
    }

    const timer = setTimeout(() => setStalled(true), 30_000);

    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{tenant.name}</h1>

      {status === "provisioning" && (
        <Card className="space-y-2 p-6">
          <p className="font-medium">Building the store…</p>
          <p className="text-muted-foreground text-sm">
            Creating its database, running migrations and setting up the admin account.
            This usually takes a few seconds.
          </p>
          {stalled && (
            <FormAlert
              tone="error"
              message="Still waiting. Provisioning runs on the queue — check that a worker is running (php artisan queue:work). The store will finish on its own once one is."
            />
          )}
        </Card>
      )}

      {status === "active" && (
        <Card className="space-y-3 p-6">
          <FormAlert tone="success" message="Store ready." />
          <p className="text-sm">
            <a
              href={`${tenantOrigin(current?.primary_domain ?? "")}/admin`}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Open {current?.primary_domain}/admin
            </a>
          </p>
          <div className="flex gap-2">
            <Button onClick={onDone}>Done</Button>
            <Link href={`/super-admin/tenants/${tenant.id}`}>
              <Button variant="secondary">View tenant</Button>
            </Link>
          </div>
        </Card>
      )}

      {status === "provision_failed" && (
        <Card className="space-y-3 p-6">
          <FormAlert message={current?.provision_error ?? "Provisioning failed."} />
          <Button
            loading={retrying}
            onClick={async () => {
              setRetrying(true);
              // A retry restarts the wait, so the stall warning must not carry
              // over from the previous attempt.
              setStalled(false);
              try {
                await platformService.retryProvisioning(tenant.id);
              } finally {
                setRetrying(false);
              }
            }}
          >
            Retry
          </Button>
        </Card>
      )}
    </div>
  );
}
