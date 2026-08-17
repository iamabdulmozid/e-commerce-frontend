"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth";

export default function SecurityPage() {
  const [error, setError] = useState<ApiError | null>(null);
  const [changed, setChanged] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    data: sessions,
    isLoading: sessionsLoading,
    mutate: reloadSessions,
  } = useSWR("/me/sessions", async () => (await authService.sessions()).items, {
    shouldRetryOnError: false,
  });

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setChanged(false);
    setLoading(true);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await authService.changePassword({
        current_password: String(data.get("current_password")),
        password: String(data.get("password")),
        password_confirmation: String(data.get("password_confirmation")),
      });
      setChanged(true);
      form.reset();
    } catch (e) {
      setError(
        e instanceof ApiError ? e : new ApiError("Something went wrong", 0),
      );
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    await authService.revokeSession(id);
    await reloadSessions();
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="space-y-1">
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            At least 8 characters, with letters and numbers.
          </CardDescription>
        </div>

        {changed && <FormAlert message="Password changed." tone="success" />}

        <form onSubmit={changePassword} className="space-y-4" noValidate>
          <Field
            label="Current password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
            error={error?.fieldError("current_password")}
          />
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            error={error?.fieldError("password")}
          />
          <Field
            label="Confirm new password"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
          />
          <Button type="submit" loading={loading}>
            Update password
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Signed-in devices. Revoke any you don&apos;t recognise.
          </CardDescription>
        </div>

        {sessionsLoading && (
          <p className="text-muted-foreground text-sm">Loading sessions…</p>
        )}
        {sessions?.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No other active sessions.
          </p>
        )}

        <ul className="divide-y">
          {sessions?.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {session.ip ?? "Unknown IP"}
                  {session.is_current && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      (this device)
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {session.user_agent ?? "Unknown device"} ·{" "}
                  {new Date(session.last_active_at).toLocaleString()}
                </p>
              </div>
              {!session.is_current && (
                <Button variant="ghost" onClick={() => revoke(session.id)}>
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
