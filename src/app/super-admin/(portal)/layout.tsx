"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PlatformAuthProvider,
  RequirePlatformAuth,
  usePlatformAuth,
} from "@/components/platform/platform-auth-provider";
import { cn } from "@/lib/utils";
import { canPlatform } from "@/services/platform";

const NAV = [
  { href: "/super-admin", label: "Dashboard", ability: "platform.dashboard" },
  { href: "/super-admin/tenants", label: "Tenants", ability: "tenant.view" },
  { href: "/super-admin/packages", label: "Packages", ability: "package.view" },
  { href: "/super-admin/invoices", label: "Invoices", ability: "invoice.view" },
  { href: "/super-admin/users", label: "Staff", ability: "platform_user.manage" },
  { href: "/super-admin/audit-logs", label: "Audit log", ability: "audit.view" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformAuthProvider>
      <RequirePlatformAuth>
        <Shell>{children}</Shell>
      </RequirePlatformAuth>
    </PlatformAuthProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = usePlatformAuth();

  // Hiding a link the API would refuse anyway; authorization stays server-side.
  const visible = NAV.filter((item) => canPlatform(user, item.ability));

  return (
    <div className="flex min-h-screen">
      <aside className="bg-card w-56 shrink-0 border-r p-4">
        <p className="mb-1 text-xs font-semibold tracking-widest text-violet-600 uppercase dark:text-violet-400">
          Platform
        </p>
        <p className="mb-6 font-semibold">Super Admin</p>

        <nav className="space-y-1">
          {visible.map((item) => {
            const active =
              item.href === "/super-admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  active ? "bg-accent font-medium" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-muted-foreground text-sm">
            {user?.name} · {user?.role.replace("_", " ")}
          </span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/super-admin/profile" className="underline">
              Profile
            </Link>
            <button
              onClick={async () => {
                await logout();
                router.push("/super-admin/login");
              }}
              className="underline"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
