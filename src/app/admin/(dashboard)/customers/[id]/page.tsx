"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { customerService } from "@/services/customer";

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = Number(params.id);
  const [error, setError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  const {
    data: customer,
    isLoading,
    mutate: reload,
  } = useSWR(
    ["/admin/customers", customerId],
    async ([, id]) => customerService.show(id),
    { shouldRetryOnError: false },
  );

  const { data: groups } = useSWR(
    "/admin/customer-groups",
    async () => (await customerService.groups()).items,
    { shouldRetryOnError: false },
  );

  const { data: tags } = useSWR(
    "/admin/customer-tags",
    async () => (await customerService.tags()).items,
    { shouldRetryOnError: false },
  );

  async function patch(payload: Parameters<typeof customerService.update>[1]) {
    setError(null);
    try {
      await customerService.update(customerId, payload);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save");
    }
  }

  async function saveTags(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = Array.from(
      new FormData(event.currentTarget).getAll("tags"),
    ).map(String);
    setError(null);
    try {
      await customerService.syncTags(customerId, selected);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save tags");
    }
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const note = String(new FormData(form).get("note") ?? "").trim();
    if (!note) return;

    setSavingNote(true);
    setError(null);
    try {
      await customerService.addNote(customerId, note);
      form.reset();
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to add note");
    } finally {
      setSavingNote(false);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading customer…</p>;
  }

  if (!customer) {
    return <FormAlert message="Customer not found." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/customers"
          className="text-muted-foreground text-sm underline"
        >
          ← Back to customers
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{customer.name}</h1>
        <p className="text-muted-foreground text-sm">
          {customer.email} · {customer.phone ?? "No phone"} ·{" "}
          {customer.email_verified ? "Verified" : "Unverified"}
        </p>
      </div>

      {error && <FormAlert message={error} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardTitle className="text-base">Account</CardTitle>

          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              value={customer.status}
              onChange={(event) => patch({ status: event.target.value })}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="group" className="block text-sm font-medium">
              Customer group
            </label>
            <select
              id="group"
              value={customer.group?.id ?? ""}
              onChange={(event) =>
                patch({
                  customer_group_id: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">No group</option>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <CardDescription>
            Marketing consent:{" "}
            {customer.marketing_consent ? "opted in" : "opted out"}
            {customer.marketing_consent_at &&
              ` (${new Date(customer.marketing_consent_at).toLocaleDateString()})`}
          </CardDescription>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Tags</CardTitle>
          {tags?.length === 0 ? (
            <CardDescription>No tags defined yet.</CardDescription>
          ) : (
            <form onSubmit={saveTags} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {tags?.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag.slug}
                      defaultChecked={customer.tags?.some(
                        (t) => t.slug === tag.slug,
                      )}
                      className="size-4"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
              <Button type="submit">Save tags</Button>
            </form>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Addresses</CardTitle>
        {customer.addresses?.length === 0 && (
          <CardDescription>No addresses saved.</CardDescription>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {customer.addresses?.map((address) => (
            <div
              key={address.id}
              className="text-muted-foreground rounded-md border p-3 text-sm"
            >
              <p className="text-foreground font-medium">
                {address.recipient_name}
                {address.is_default_shipping && (
                  <span className="bg-accent ml-2 rounded px-2 py-0.5 text-xs">
                    Default
                  </span>
                )}
              </p>
              <p>{address.phone}</p>
              <p>
                {address.address_line}, {address.area}, {address.district}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle className="text-base">Internal notes</CardTitle>
          <CardDescription>
            Staff-only. Customers never see these, and they cannot be edited or
            deleted.
          </CardDescription>
        </div>

        <form onSubmit={addNote} className="space-y-2">
          <textarea
            name="note"
            rows={3}
            maxLength={2000}
            placeholder="What happened, and what did we agree?"
            aria-label="New note"
            className="border-input bg-background w-full rounded-md border p-3 text-sm"
          />
          <Button type="submit" loading={savingNote}>
            Add note
          </Button>
        </form>

        <ul className="divide-y">
          {customer.notes?.length === 0 && (
            <li className="text-muted-foreground py-2 text-sm">
              No notes yet.
            </li>
          )}
          {customer.notes?.map((note) => (
            <li key={note.id} className="py-3 text-sm">
              <p>{note.note}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {note.admin?.name ?? "System"} ·{" "}
                {new Date(note.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
