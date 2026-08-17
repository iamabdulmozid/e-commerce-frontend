"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { authService } from "@/services/auth";

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
    <div className="space-y-4">
      {!user?.email_verified && (
        <Card className="space-y-3">
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Confirm {user?.email} to secure your account and enable checkout.
          </CardDescription>
          {notice ? (
            <FormAlert message={notice} tone="success" />
          ) : (
            <Button
              onClick={resendVerification}
              loading={sending}
              variant="secondary"
            >
              Resend verification email
            </Button>
          )}
        </Card>
      )}

      <Card className="space-y-2">
        <CardTitle>Welcome back, {user?.name}</CardTitle>
        <CardDescription>
          Orders, wishlist and returns appear here as those phases land.
        </CardDescription>
      </Card>
    </div>
  );
}
