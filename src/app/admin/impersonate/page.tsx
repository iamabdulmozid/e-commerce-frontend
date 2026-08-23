"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api";

/**
 * Landing page for an impersonation link.
 *
 * Lives on the TENANT host: this is where the session has to be created, and
 * the token is only valid here. It is spent immediately on arrival because it
 * lives for sixty seconds and is single-use.
 */
export default function ImpersonateLandingPage() {
  return (
    <Suspense fallback={<Shell>Starting session…</Shell>}>
      <Consume />
    </Suspense>
  );
}

function Consume() {
  const params = useSearchParams();
  const router = useRouter();
  const [failure, setFailure] = useState<string | null>(null);

  const token = params.get("token");

  // Strict Mode runs effects twice in development, and this token is
  // single-use: the second run would spend an already-spent token and report a
  // failure for a session that actually started fine.
  const consumed = useRef(false);

  useEffect(() => {
    if (!token || consumed.current) return;

    consumed.current = true;

    void (async () => {
      try {
        await api.post("/auth/impersonate", { token });
        router.replace("/admin");
      } catch (e) {
        setFailure(
          e instanceof ApiError
            ? e.message
            : "Could not start the session. Ask for a fresh link.",
        );
      }
    })();
  }, [token, router]);

  // Derived during render rather than set from the effect: React 19 rejects a
  // synchronous setState in an effect body, and a missing token is knowable
  // without doing any work.
  const error = token ? failure : "This link is missing its token.";

  return <Shell>{error ? <FormAlert message={error} /> : "Starting session…"}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-3">
        <CardTitle>Support access</CardTitle>
        <div className="text-sm">{children}</div>
      </Card>
    </main>
  );
}
