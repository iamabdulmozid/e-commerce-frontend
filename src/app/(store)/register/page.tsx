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

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password")),
      password_confirmation: String(form.get("password_confirmation")),
    };

    try {
      await authService.register(payload);
      // Registration does not sign the customer in; log them in explicitly.
      const user = await authService.login({
        email: payload.email,
        password: payload.password,
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
          <CardTitle>Create your account</CardTitle>
          <CardDescription>It only takes a minute.</CardDescription>
        </div>

        {error && !error.errors && <FormAlert message={error.message} />}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            label="Full name"
            name="name"
            required
            error={error?.fieldError("name")}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={error?.fieldError("email")}
          />
          <Field
            label="Phone (optional)"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            error={error?.fieldError("phone")}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            error={error?.fieldError("password")}
          />
          <Field
            label="Confirm password"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
