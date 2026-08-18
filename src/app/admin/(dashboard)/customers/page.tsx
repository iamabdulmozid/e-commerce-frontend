"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { customerService } from "@/services/customer";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [group, setGroup] = useState("");

  const { data, isLoading, error } = useSWR(
    ["/admin/customers", search, status, group],
    async ([, q, statusFilter, groupFilter]) =>
      customerService.list({
        q: q || undefined,
        status: statusFilter || undefined,
        group: groupFilter || undefined,
        per_page: 25,
      }),
    { shouldRetryOnError: false, keepPreviousData: true },
  );

  const { data: groups } = useSWR(
    "/admin/customer-groups",
    async () => (await customerService.groups()).items,
    { shouldRetryOnError: false },
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm">
          {data?.meta.total ?? 0} customer{data?.meta.total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email or phone…"
          aria-label="Search customers"
          className="border-input bg-background h-9 min-w-64 flex-1 rounded-md border px-3 text-sm"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        <select
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          aria-label="Filter by group"
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
        >
          <option value="">Any group</option>
          {groups?.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {error != null && (
        <FormAlert
          message={
            error instanceof ApiError
              ? error.message
              : "Failed to load customers"
          }
        />
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Group</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
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
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  No customers match these filters.
                </td>
              </tr>
            )}
            {data?.items.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="underline"
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="block">{customer.email}</span>
                  <span className="text-muted-foreground text-xs">
                    {customer.phone ?? "No phone"}
                  </span>
                </td>
                <td className="px-4 py-3">{customer.group?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  {customer.tags?.map((tag) => tag.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">{customer.status}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
