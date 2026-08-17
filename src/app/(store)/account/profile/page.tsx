"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const updated = await authService.updateProfile({
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone") ?? "") || null,
      });
      setUser(updated);
      setSaved(true);
    } catch (e) {
      setError(
        e instanceof ApiError ? e : new ApiError("Something went wrong", 0),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Changing your email requires verifying the new address.
        </CardDescription>
      </div>

      {saved && <FormAlert message="Profile updated." tone="success" />}
      {error && !Object.keys(error.errors).length && (
        <FormAlert message={error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Full name"
          name="name"
          defaultValue={user?.name}
          required
          error={error?.fieldError("name")}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={user?.email}
          required
          error={error?.fieldError("email")}
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          defaultValue={user?.phone ?? ""}
          error={error?.fieldError("phone")}
        />
        <Button type="submit" loading={loading}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}
