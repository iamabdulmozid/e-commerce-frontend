"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function AdminHomePage() {
  const { user } = useAuth();
  const permissionCount = user?.permissions?.includes("*")
    ? "all"
    : (user?.permissions?.length ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          KPIs and charts arrive with the reporting phase.
        </p>
      </div>

      <Card className="space-y-2">
        <CardTitle>Signed in as {user?.name}</CardTitle>
        <CardDescription>
          Roles: {user?.roles?.map((role) => role.label).join(", ") || "none"} ·
          Permissions: {permissionCount}
        </CardDescription>
      </Card>
    </div>
  );
}
