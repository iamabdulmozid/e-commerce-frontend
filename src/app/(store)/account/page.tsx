"use client";

import { ArrowRight, MailCheck, MapPin, Shield, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { authService } from "@/services/auth";

/**
 * The account dashboard.
 *
 * It shows what the account area actually contains today. Order history,
 * wishlist and returns arrive with Phases 10, 18 and 13; empty tiles promising
 * them would be worse than their absence.
 */
export default function AccountDashboardPage() {
  const { user } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function resendVerification() {
    setSending(true);
    try {
      await authService.resendVerification();
      setNotice("Verification email sent — check your inbox.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {!user?.email_verified && (
        <Card className="border-warning/40 bg-warning-soft space-y-3">
          <div className="flex items-start gap-3">
            <MailCheck className="text-warning-foreground mt-0.5 size-5 shrink-0" />
            <div>
              <CardTitle className="text-base">Verify your email</CardTitle>
              <CardDescription className="text-warning-foreground/80 mt-1">
                Confirm {user?.email} to secure your account.
              </CardDescription>
            </div>
          </div>

          {notice ? (
            <FormAlert message={notice} tone="success" />
          ) : (
            <Button onClick={resendVerification} loading={sending} variant="outline" size="sm">
              Resend verification email
            </Button>
          )}
        </Card>
      )}

      <Card>
        <CardTitle>Welcome back, {user?.name?.split(" ")[0]}</CardTitle>
        <CardDescription className="mt-1">
          Your details live here. Order history and returns will appear as those
          parts of the shop go live.
        </CardDescription>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          href="/account/profile"
          icon={UserRound}
          title="Profile"
          description="Name, email and phone"
        />
        <Tile
          href="/account/addresses"
          icon={MapPin}
          title="Addresses"
          description="Where your orders go"
        />
        <Tile
          href="/account/security"
          icon={Shield}
          title="Security"
          description="Password and sessions"
        />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Keep shopping</CardTitle>
          <CardDescription className="mt-1">
            Browse the catalogue by category, brand or price.
          </CardDescription>
        </div>
        <ButtonLink href="/products" variant="outline" size="sm">
          Browse products
          <ArrowRight />
        </ButtonLink>
      </Card>
    </div>
  );
}

function Tile({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <ButtonLink
      href={href}
      variant="outline"
      className="hover:border-primary/40 hover:shadow-card h-auto flex-col items-start gap-1 p-5 text-left transition-all"
    >
      <Icon className="text-primary mb-2 size-5" aria-hidden />
      <span className="font-display font-semibold">{title}</span>
      <span className="text-muted-foreground text-xs font-normal">
        {description}
      </span>
    </ButtonLink>
  );
}
