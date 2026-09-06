"use client";

import { Lock, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
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
    <AuthShell
      title="Create your account"
      description="It only takes a minute."
      footer={
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error && !error.errors && <FormAlert message={error.message} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Full name"
          name="name"
          icon={<User />}
          required
          error={error?.fieldError("name")}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          icon={<Mail />}
          required
          error={error?.fieldError("email")}
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          icon={<Phone />}
          placeholder="01XXXXXXXXX"
          hint="Optional — used for delivery updates."
          error={error?.fieldError("phone")}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          icon={<Lock />}
          required
          hint="At least 8 characters."
          error={error?.fieldError("password")}
        />
        <Field
          label="Confirm password"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          icon={<Lock />}
          required
        />

        <Button type="submit" full loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
