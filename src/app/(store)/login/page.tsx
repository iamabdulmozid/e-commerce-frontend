"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
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
    <main className="mx-auto w-full max-w-md p-6">
      <Card className="space-y-5">
        <div className="space-y-1">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your orders, wishlist and account.
          </CardDescription>
        </div>

        {error && (
          <FormAlert message={error.fieldError("email") ?? error.message} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={error?.fieldError("password")}
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remember" className="size-4" />
            Keep me signed in
          </label>

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="text-muted-foreground flex justify-between text-sm">
          <Link href="/forgot-password" className="underline">
            Forgot password?
          </Link>
          <Link href="/register" className="underline">
            Create an account
          </Link>
        </div>
      </Card>
    </main>
  );
}
