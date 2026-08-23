"use client";

import { useState } from "react";
import { usePlatformAuth } from "@/components/platform/platform-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { platformService } from "@/services/platform";

export default function PlatformProfilePage() {
  const { user, refresh } = usePlatformAuth();
  const [notice, setNotice] = useState<{ tone: "error" | "success"; message: string } | null>(
    null,
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="text-muted-foreground text-sm">
          Your platform account. Separate from any store account you may also hold.
        </p>
      </div>

      {notice && <FormAlert tone={notice.tone} message={notice.message} />}

      <Card className="space-y-4">
        <CardTitle>Details</CardTitle>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setNotice(null);
            setSavingProfile(true);

            try {
              await platformService.updateProfile({
                name: String(form.get("name")),
                email: String(form.get("email")),
              });
              await refresh();
              setNotice({ tone: "success", message: "Profile updated." });
            } catch (e) {
              setNotice({
                tone: "error",
                message: e instanceof ApiError ? e.displayMessage : "Something went wrong",
              });
            } finally {
              setSavingProfile(false);
            }
          }}
        >
          <Field label="Name" name="name" defaultValue={user.name} required />
          <Field label="Email" name="email" type="email" defaultValue={user.email} required />
          <Button type="submit" loading={savingProfile}>
            Save
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Your current password is required — proving you still hold it is what stops a
            hijacked session from locking you out.
          </CardDescription>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const form = new FormData(formElement);
            setNotice(null);
            setSavingPassword(true);

            try {
              await platformService.updatePassword({
                current_password: String(form.get("current_password")),
                password: String(form.get("password")),
                password_confirmation: String(form.get("password_confirmation")),
              });
              formElement.reset();
              setNotice({ tone: "success", message: "Password updated." });
            } catch (e) {
              setNotice({
                tone: "error",
                message:
                  e instanceof ApiError
                    ? (e.fieldError("current_password") ??
                      e.fieldError("password") ??
                      e.displayMessage)
                    : "Something went wrong",
              });
            } finally {
              setSavingPassword(false);
            }
          }}
        >
          <Field
            label="Current password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <Field
            label="Confirm new password"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
          />
          <Button type="submit" loading={savingPassword}>
            Change password
          </Button>
        </form>
      </Card>
    </div>
  );
}
