"use client";

import { LayoutDashboard, LogOut, MapPin, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/security", label: "Security", icon: Shield },
];

/**
 * The account area's shell.
 *
 * A sidebar from `lg` and a horizontal scroller below it — the same links
 * either way, so nothing is reachable on one screen size and not the other.
 *
 * Orders, wishlist and returns are deliberately absent: those pages arrive
 * with their own phases, and a nav item leading to a "coming soon" page is a
 * promise the shop cannot keep (PRD 5B rule 10).
 */
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
      <Container className="py-8 lg:py-12">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="bg-primary-soft text-primary-soft-foreground font-display flex size-14 items-center justify-center rounded-2xl text-xl font-bold">
              {user?.name?.slice(0, 1).toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold lg:text-3xl">
                {user?.name ?? "My account"}
              </h1>
              <p className="text-muted-foreground truncate text-sm">
                {user?.email}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            <LogOut />
            Sign out
          </Button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
          <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
            <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {NAV.map((item) => {
                const active = pathname === item.href;

                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-primary-soft text-primary-soft-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </RequireAuth>
  );
}
