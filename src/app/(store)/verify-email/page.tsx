"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const MESSAGES: Record<string, { title: string; description: string }> = {
  success: {
    title: "Email verified",
    description:
      "Thanks — your email address is confirmed. You can now check out.",
  },
  "already-verified": {
    title: "Already verified",
    description: "This address was confirmed earlier. Nothing else to do.",
  },
  invalid: {
    title: "Link not valid",
    description:
      "That verification link is invalid or has expired. Request a new one from your account security page.",
  },
};

function VerifyEmailResult() {
  const status = useSearchParams().get("status") ?? "invalid";
  const { title, description } = MESSAGES[status] ?? MESSAGES.invalid;

  return (
    <>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card className="space-y-3">
        <Suspense fallback={<CardTitle>Checking…</CardTitle>}>
          <VerifyEmailResult />
        </Suspense>
        <Link href="/account" className="inline-block text-sm underline">
          Go to my account
        </Link>
      </Card>
    </main>
  );
}
