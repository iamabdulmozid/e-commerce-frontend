"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { addressService } from "@/services/customer";
import type { Address, AddressPayload } from "@/types/customer";

export default function AddressesPage() {
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const {
    data: addresses,
    isLoading,
    mutate: reload,
  } = useSWR("/me/addresses", async () => (await addressService.list()).items, {
    shouldRetryOnError: false,
  });

  const { data: districts } = useSWR(
    "/districts",
    async () => (await addressService.districts()).items,
    { shouldRetryOnError: false, revalidateOnFocus: false },
  );

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload: AddressPayload = {
      label: String(form.get("label") ?? "") || null,
      recipient_name: String(form.get("recipient_name")),
      phone: String(form.get("phone")),
      district: String(form.get("district")),
      area: String(form.get("area")),
      address_line: String(form.get("address_line")),
      postal_code: String(form.get("postal_code") ?? "") || null,
    };

    try {
      if (editing === "new") {
        await addressService.create(payload);
      } else if (editing) {
        await addressService.update(editing.id, payload);
      }
      setEditing(null);
      await reload();
    } catch (e) {
      setError(
        e instanceof ApiError ? e : new ApiError("Something went wrong", 0),
      );
    }
  }

  async function remove(address: Address) {
    setError(null);
    try {
      await addressService.remove(address.id);
      await reload();
    } catch (e) {
      setError(
        e instanceof ApiError ? e : new ApiError("Something went wrong", 0),
      );
    }
  }

  async function makeDefault(address: Address) {
    await addressService.setDefault(address.id, "both");
    await reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Address book</h2>
          <p className="text-muted-foreground text-sm">
            Used at checkout. You can save up to 10 addresses.
          </p>
        </div>
        {editing === null && (
          <Button onClick={() => setEditing("new")}>Add address</Button>
        )}
      </div>

      {error && (
        <FormAlert
          message={
            error.fieldError("address") ??
            error.fieldError("district") ??
            error.message
          }
        />
      )}

      {editing !== null && (
        <Card className="space-y-4">
          <CardTitle>
            {editing === "new" ? "New address" : "Edit address"}
          </CardTitle>
          <form onSubmit={save} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Label (optional)"
                name="label"
                placeholder="Home, Office…"
                defaultValue={editing === "new" ? "" : (editing.label ?? "")}
              />
              <Field
                label="Recipient name"
                name="recipient_name"
                required
                defaultValue={editing === "new" ? "" : editing.recipient_name}
                error={error?.fieldError("recipient_name")}
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                placeholder="01712345678"
                required
                defaultValue={editing === "new" ? "" : editing.phone}
                error={error?.fieldError("phone")}
              />
              <div className="space-y-1.5">
                <label htmlFor="district" className="block text-sm font-medium">
                  District
                </label>
                <select
                  id="district"
                  name="district"
                  required
                  defaultValue={editing === "new" ? "" : editing.district}
                  className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">Select a district</option>
                  {districts?.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                {error?.fieldError("district") && (
                  <p className="text-destructive text-sm">
                    {error.fieldError("district")}
                  </p>
                )}
              </div>
              <Field
                label="Area"
                name="area"
                placeholder="Mirpur 10"
                required
                defaultValue={editing === "new" ? "" : editing.area}
                error={error?.fieldError("area")}
              />
              <Field
                label="Postal code (optional)"
                name="postal_code"
                placeholder="1216"
                defaultValue={
                  editing === "new" ? "" : (editing.postal_code ?? "")
                }
                error={error?.fieldError("postal_code")}
              />
            </div>
            <Field
              label="Address"
              name="address_line"
              placeholder="House 12, Road 4"
              required
              defaultValue={editing === "new" ? "" : editing.address_line}
              error={error?.fieldError("address_line")}
            />
            <div className="flex gap-2">
              <Button type="submit">Save address</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading && (
        <p className="text-muted-foreground text-sm">Loading addresses…</p>
      )}
      {addresses?.length === 0 && editing === null && (
        <Card>
          <CardDescription>
            No addresses saved yet. Add one to speed up checkout.
          </CardDescription>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {addresses?.map((address) => (
          <Card key={address.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">
                {address.label ?? "Address"}
              </CardTitle>
              <div className="flex gap-1">
                {address.is_default_shipping && (
                  <span className="bg-accent rounded px-2 py-0.5 text-xs">
                    Shipping
                  </span>
                )}
                {address.is_default_billing && (
                  <span className="bg-accent rounded px-2 py-0.5 text-xs">
                    Billing
                  </span>
                )}
              </div>
            </div>
            <div className="text-muted-foreground text-sm">
              <p className="text-foreground font-medium">
                {address.recipient_name}
              </p>
              <p>{address.phone}</p>
              <p>
                {address.address_line}, {address.area}
              </p>
              <p>
                {address.district}
                {address.postal_code ? ` – ${address.postal_code}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              <Button variant="ghost" onClick={() => setEditing(address)}>
                Edit
              </Button>
              {!(address.is_default_shipping && address.is_default_billing) && (
                <Button variant="ghost" onClick={() => makeDefault(address)}>
                  Make default
                </Button>
              )}
              <Button variant="ghost" onClick={() => remove(address)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
