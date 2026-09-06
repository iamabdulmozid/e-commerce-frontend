"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
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
    <AuthShell
      title="Reset your password"
      description="We'll email you a link to choose a new one."
      footer={
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      {status && <FormAlert message={status} tone="success" />}
      {error && <FormAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          icon={<Mail />}
          required
        />
        <Button type="submit" full loading={loading}>
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
