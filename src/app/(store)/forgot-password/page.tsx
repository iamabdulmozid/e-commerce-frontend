"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    const email = String(new FormData(event.currentTarget).get("email"));

    try {
      await authService.forgotPassword(email);
      setStatus("If that email address exists, a reset link is on its way.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card className="space-y-5">
        <div className="space-y-1">
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            We&apos;ll email you a link to choose a new one.
          </CardDescription>
        </div>

        {status && <FormAlert message={status} tone="success" />}
        {error && <FormAlert message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>

        <Link href="/login" className="text-muted-foreground text-sm underline">
          Back to sign in
        </Link>
      </Card>
    </main>
  );
}
