"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const user = await authService.login({
        email: String(form.get("email")),
        password: String(form.get("password")),
        remember: form.get("remember") === "on",
      });

      setUser(user);
      router.push("/account");
    } catch (e) {
      setError(
        e instanceof ApiError ? e : new ApiError("Something went wrong", 0),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to reach your account, addresses and details."
      footer={
        <p className="text-muted-foreground">
          New here?{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {error && (
        <FormAlert message={error.fieldError("email") ?? error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          icon={<Mail />}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          icon={<Lock />}
          required
          error={error?.fieldError("password")}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox name="remember" label="Keep me signed in" />
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" full loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
