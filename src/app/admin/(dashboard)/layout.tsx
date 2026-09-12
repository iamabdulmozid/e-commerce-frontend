"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { ImpersonationBanner } from "@/components/platform/impersonation-banner";
import { RequireAuth } from "@/components/auth/require-auth";
import { cn } from "@/lib/utils";
import { can } from "@/types/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", permission: null },
  { href: "/admin/products", label: "Products", permission: "product.view" },
  { href: "/admin/categories", label: "Categories", permission: "category.view" },
  { href: "/admin/brands", label: "Brands", permission: "brand.view" },
  { href: "/admin/attributes", label: "Attributes", permission: "product.view" },
  { href: "/admin/price-rules", label: "Price rules", permission: "price.view" },
  { href: "/admin/inventory", label: "Inventory", permission: "inventory.view" },
  { href: "/admin/media", label: "Media", permission: "media.upload" },
  { href: "/admin/customers", label: "Customers", permission: "customer.view" },
  { href: "/admin/users", label: "Users", permission: "user.manage" },
  { href: "/admin/roles", label: "Roles", permission: "role.manage" },
  { href: "/admin/audit-logs", label: "Audit log", permission: "audit.view" },
  { href: "/admin/billing", label: "Billing", permission: "billing.view" },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Hiding a link the API would refuse anyway; authorization stays server-side.
  const visible = NAV.filter(
    (item) => !item.permission || can(user, item.permission),
  );

  return (
    <RequireAuth type="admin" loginPath="/admin/login">
      <div className="flex min-h-screen">
        <aside className="bg-card w-56 shrink-0 border-r p-4">
          <p className="mb-6 font-semibold">Admin</p>
          <nav className="space-y-1">
            {visible.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  pathname === item.href
                    ? "bg-accent font-medium"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b px-6 py-3">
            <span className="text-muted-foreground text-sm">
              {user?.name} ·{" "}
              {user?.roles?.map((role) => role.label).join(", ") || "No role"}
            </span>
            <button
              onClick={async () => {
                await logout();
                router.push("/admin/login");
              }}
              className="text-sm underline"
            >
              Sign out
            </button>
          </header>
          <ImpersonationBanner />
          <SubscriptionBanner />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
