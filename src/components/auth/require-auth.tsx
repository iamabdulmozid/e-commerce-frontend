"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";

/**
 * Client-side guard. This is a UX convenience only — every protected endpoint
 * is enforced server-side, so a bypassed guard exposes nothing.
 */
export function RequireAuth({
  children,
  type = "customer",
  loginPath = "/login",
}: {
  children: React.ReactNode;
  type?: "customer" | "admin";
  loginPath?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.type !== type)) {
      router.replace(loginPath);
    }
  }, [loading, user, type, loginPath, router]);

  if (loading) {
    return (
      <div className="text-muted-foreground p-8 text-sm" role="status">
        Loading…
      </div>
    );
  }

  if (!user || user.type !== type) {
    return null;
  }

  return <>{children}</>;
}
