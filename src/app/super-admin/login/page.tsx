"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PlatformAuthProvider,
  usePlatformAuth,
} from "@/components/platform/platform-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { platformService } from "@/services/platform";

export default function PlatformLoginPage() {
  return (
    <PlatformAuthProvider>
      <LoginForm />
    </PlatformAuthProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  const { setUser } = usePlatformAuth();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      const user = await platformService.login(
        String(form.get("email")),
        String(form.get("password")),
      );
      setUser(user);
      router.push("/super-admin");
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError("Something went wrong", 0));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-5">
        <div className="space-y-1">
          {/* A distinct accent so a platform screen is never mistaken for a
              tenant one - the two look similar and do very different things. */}
          <p className="text-xs font-semibold tracking-widest text-violet-600 uppercase dark:text-violet-400">
            Platform
          </p>
          <CardTitle>Super Admin Portal</CardTitle>
          <CardDescription>Platform staff only.</CardDescription>
        </div>

        {error && <FormAlert message={error.fieldError("email") ?? error.message} />}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
