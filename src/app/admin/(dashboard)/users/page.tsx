"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { adminService } from "@/services/admin";
import type { User } from "@/types/auth";

export default function AdminUsersPage() {
  const [typeFilter, setTypeFilter] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);

  const {
    data: users,
    isLoading,
    mutate: reloadUsers,
  } = useSWR(
    ["/admin/users", typeFilter],
    async ([, type]) =>
      (await adminService.users({ type, per_page: 25 })).items,
    { shouldRetryOnError: false },
  );

  const { data: roles } = useSWR(
    "/admin/roles",
    async () => (await adminService.roles()).items,
    { shouldRetryOnError: false },
  );

  async function saveRoles(user: User, selected: string[]) {
    setError(null);
    try {
      await adminService.syncUserRoles(user.id, selected);
      setEditing(null);
      await reloadUsers();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? (e.fieldError("roles") ?? e.message)
          : "Failed to save",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          aria-label="Filter by user type"
        >
          <option value="admin">Admins</option>
          <option value="customer">Customers</option>
          <option value="">All</option>
        </select>
      </div>

      {error && <FormAlert message={error} />}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Roles</th>
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
            {users?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-6">
                  No users found.
                </td>
              </tr>
            )}
            {users?.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.type}</td>
                <td className="px-4 py-3">{user.status}</td>
                <td className="px-4 py-3">
                  {user.roles?.map((role) => role.label).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.type === "admin" && (
                    <Button variant="ghost" onClick={() => setEditing(user)}>
                      Edit roles
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {editing && (
        <Card className="space-y-4">
          <CardTitle>Roles for {editing.name}</CardTitle>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const selected = Array.from(
                new FormData(event.currentTarget).getAll("roles"),
              ).map(String);
              void saveRoles(editing, selected);
            }}
            className="space-y-4"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {roles?.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={role.name}
                    defaultChecked={editing.roles?.some(
                      (r) => r.name === role.name,
                    )}
                    className="size-4"
                  />
                  {role.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save roles</Button>
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
    </div>
  );
}
