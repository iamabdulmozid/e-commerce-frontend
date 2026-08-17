"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { adminService } from "@/services/admin";
import type { Permission, Role } from "@/types/auth";

export default function AdminRolesPage() {
  const [editing, setEditing] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const {
    data: roles,
    isLoading,
    mutate: reloadRoles,
  } = useSWR("/admin/roles", async () => (await adminService.roles()).items, {
    shouldRetryOnError: false,
  });

  const { data: permissions } = useSWR(
    "/admin/permissions",
    async () => (await adminService.permissions()).items,
    { shouldRetryOnError: false },
  );

  const groups = (permissions ?? []).reduce<Record<string, Permission[]>>(
    (acc, permission) => {
      (acc[permission.group] ??= []).push(permission);
      return acc;
    },
    {},
  );

  async function savePermissions(role: Role, selected: string[]) {
    setError(null);
    try {
      await adminService.updateRolePermissions(role.id, selected);
      setSaved(`Permissions updated for ${role.label}.`);
      setEditing(null);
      await reloadRoles();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Roles &amp; permissions</h1>
        <p className="text-muted-foreground text-sm">
          Super Admin bypasses all checks and therefore holds no explicit
          permissions.
        </p>
      </div>

      {error && <FormAlert message={error} />}
      {saved && <FormAlert message={saved} tone="success" />}

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {roles?.map((role) => (
          <Card key={role.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{role.label}</CardTitle>
                <CardDescription>
                  {role.name} · {role.permissions?.length ?? 0} permissions ·{" "}
                  {role.users_count ?? 0} users
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setEditing(role)}>
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <Card className="space-y-4">
          <CardTitle>Permissions for {editing.label}</CardTitle>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const selected = Array.from(
                new FormData(event.currentTarget).getAll("permissions"),
              ).map(String);
              void savePermissions(editing, selected);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(groups).map(([group, items]) => (
                <fieldset key={group} className="space-y-1">
                  <legend className="text-sm font-medium capitalize">
                    {group}
                  </legend>
                  {items.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permission.name}
                        defaultChecked={editing.permissions?.includes(
                          permission.name,
                        )}
                        className="size-4"
                      />
                      <span className="text-muted-foreground">
                        {permission.name.split(".").slice(1).join(".")}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save permissions</Button>
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
