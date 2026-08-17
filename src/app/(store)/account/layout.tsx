"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { RequireAuth } from "@/components/auth/require-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/security", label: "Security" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My account</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="text-sm underline"
          >
            Sign out
          </button>
        </header>

        <nav className="flex gap-1 border-b">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "border-b-2 px-3 py-2 text-sm",
                pathname === item.href
                  ? "border-primary font-medium"
                  : "text-muted-foreground border-transparent",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </RequireAuth>
  );
}
