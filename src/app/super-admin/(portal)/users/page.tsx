"use client";

import { useState } from "react";
import useSWR from "swr";
import { usePlatformAuth } from "@/components/platform/platform-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { platformService, type PlatformRole } from "@/services/platform";

export default function PlatformUsersPage() {
  const { user: me } = usePlatformAuth();
  const [notice, setNotice] = useState<{ tone: "error" | "success"; message: string } | null>(
    null,
  );
  const [creating, setCreating] = useState(false);

  const { data, mutate, isLoading, error } = useSWR(
    "/platform/users",
    () => platformService.users(),
    { shouldRetryOnError: false },
  );

  async function run(action: () => Promise<unknown>, success: string) {
    setNotice(null);

    try {
      await action();
      await mutate();
      setNotice({ tone: "success", message: success });

      return true;
    } catch (e) {
      setNotice({
        tone: "error",
        message:
          e instanceof ApiError
            ? (e.fieldError("role") ?? e.fieldError("email") ?? e.displayMessage)
            : "Something went wrong",
      });

      return false;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Platform staff</h1>
          <p className="text-muted-foreground text-sm">
            Who can operate the platform. Roles are defined in code, not stored per user, so
            what each one grants is the same everywhere.
          </p>
        </div>

        {!creating && <Button onClick={() => setCreating(true)}>Add staff</Button>}
      </div>

      {error != null && (
        <FormAlert
          message={error instanceof ApiError ? error.message : "Failed to load staff"}
        />
      )}
      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      {creating && data && (
        <CreateStaffForm
          roles={data.roles}
          onCancel={() => setCreating(false)}
          onCreate={async (payload) => {
            const ok = await run(
              () => platformService.createUser(payload),
              "Platform user created",
            );
            if (ok) setCreating(false);
          }}
        />
      )}

      {isLoading && <Card className="text-sm">Loading…</Card>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last seen</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.items.map((staff) => (
              <tr key={staff.id}>
                <td className="px-4 py-3 font-medium">
                  {staff.name}
                  {staff.id === me?.id && (
                    <span className="text-muted-foreground text-xs"> (you)</span>
                  )}
                </td>
                <td className="text-muted-foreground px-4 py-3">{staff.email}</td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Role for ${staff.name}`}
                    value={staff.role}
                    onChange={(e) =>
                      run(
                        () =>
                          platformService.updateUser(staff.id, {
                            role: e.target.value as PlatformRole,
                          }),
                        "Role updated",
                      )
                    }
                    className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                  >
                    {data.roles.map((role) => (
                      <option key={role.role} value={role.role}>
                        {role.role.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      staff.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {staff.status}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                  {staff.last_login_at
                    ? new Date(staff.last_login_at).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  {staff.id !== me?.id && (
                    <button
                      className="text-destructive underline"
                      onClick={() =>
                        run(() => platformService.deleteUser(staff.id), "Platform user removed")
                      }
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data && (
        <Card className="space-y-3">
          <CardTitle>What each role can do</CardTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.roles.map((role) => (
              <div key={role.role}>
                <p className="text-sm font-medium">{role.role.replace("_", " ")}</p>
                <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                  {role.abilities.map((ability) => (
                    <li key={ability} className="font-mono">
                      {ability}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CreateStaffForm({
  roles,
  onCancel,
  onCreate,
}: {
  roles: Array<{ role: PlatformRole; abilities: string[] }>;
  onCancel: () => void;
  onCreate: (payload: {
    name: string;
    email: string;
    password: string;
    role: PlatformRole;
  }) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <CardTitle>Add platform staff</CardTitle>
        <CardDescription>
          A platform account is separate from any store account, even at the same address.
        </CardDescription>
      </div>

      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSaving(true);

          try {
            await onCreate({
              name: String(form.get("name")),
              email: String(form.get("email")),
              password: String(form.get("password")),
              role: String(form.get("role")) as PlatformRole,
            });
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />

          <div className="space-y-1.5">
            <label htmlFor="role" className="block text-sm font-medium">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="support"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              {roles.map((role) => (
                <option key={role.role} value={role.role}>
                  {role.role.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create
          </Button>
        </div>
      </form>
    </Card>
  );
}
