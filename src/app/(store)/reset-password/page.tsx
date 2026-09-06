"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      await authService.resetPassword({
        token,
        email,
        password: String(form.get("password")),
        password_confirmation: String(form.get("password_confirmation")),
      });
      router.push("/login?reset=1");
    } catch (e) {
      setError(
        e instanceof ApiError ? e : new ApiError("Something went wrong", 0),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <FormAlert message="This reset link is incomplete. Request a new one." />
    );
  }

  return (
    <>
      {error && (
        <FormAlert message={error.fieldError("email") ?? error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Email"
          name="email"
          type="email"
          icon={<Mail />}
          value={email}
          readOnly
          disabled
        />
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          icon={<Lock />}
          required
          error={error?.fieldError("password")}
        />
        <Field
          label="Confirm new password"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          icon={<Lock />}
          required
        />
        <Button type="submit" full loading={loading}>
          Set new password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least 8 characters with letters and numbers."
      footer={
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
