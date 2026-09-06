"use client";

import { CheckCircle2, MailWarning, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const MESSAGES: Record<
  string,
  { title: string; description: string; icon: LucideIcon; tone: string }
> = {
  success: {
    title: "Email verified",
    description:
      "Thanks — your email address is confirmed. Your account is fully set up.",
    icon: CheckCircle2,
    tone: "bg-success-soft text-success",
  },
  "already-verified": {
    title: "Already verified",
    description: "This address was confirmed earlier. Nothing else to do.",
    icon: ShieldCheck,
    tone: "bg-primary-soft text-primary-soft-foreground",
  },
  invalid: {
    title: "Link not valid",
    description:
      "That verification link is invalid or has expired. Request a new one from your account security page.",
    icon: MailWarning,
    tone: "bg-warning-soft text-warning-foreground",
  },
};

function VerifyEmailResult() {
  const status = useSearchParams().get("status") ?? "invalid";
  const { title, description, icon: Icon, tone } =
    MESSAGES[status] ?? MESSAGES.invalid;

  return (
    <div className="text-center sm:text-left">
      <span
        className={`mb-5 inline-flex size-14 items-center justify-center rounded-2xl ${tone}`}
      >
        <Icon className="size-7" aria-hidden />
      </span>

      <p className="font-display text-xl font-semibold">{title}</p>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>

      <div className="mt-7 flex flex-wrap justify-center gap-3 sm:justify-start">
        <ButtonLink href="/account">Go to my account</ButtonLink>
        <ButtonLink href="/products" variant="outline">
          Browse products
        </ButtonLink>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Email verification"
      footer={
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <VerifyEmailResult />
      </Suspense>
    </AuthShell>
  );
}
