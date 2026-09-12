"use client";

import { LogIn, LogOut, MapPin, Shield, User, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { CartCount } from "@/components/cart/cart-count";
import { ButtonLink } from "@/components/ui/button";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * The auth-aware corner of the header.
 *
 * This component is the entire reason the storefront layout used to be a
 * Client Component. Isolating it here is what lets the shell - and every page
 * under it - render on the server (PRD 5A rule 4).
 */
export function HeaderActions() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <CartCount />

      {loading ? (
        // A fixed-size placeholder, not a spinner: the header must not resize
        // when the session check settles.
        <div className="size-10" aria-hidden />
      ) : user ? (
        <DropdownMenu
          trigger={({ open, ...props }) => (
            <button
              type="button"
              {...props}
              className={cn(
                "hover:bg-accent flex h-10 items-center gap-2 rounded-full px-2.5 transition-colors",
                open && "bg-accent",
              )}
            >
              <span className="bg-primary-soft text-primary-soft-foreground flex size-7 items-center justify-center rounded-full text-xs font-semibold">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                {user.name.split(" ")[0]}
              </span>
            </button>
          )}
        >
          <DropdownLabel>{user.email}</DropdownLabel>
          <DropdownSeparator />
          <DropdownItem href="/account">
            <User />
            Dashboard
          </DropdownItem>
          <DropdownItem href="/account/profile">
            <UserRound />
            Profile
          </DropdownItem>
          <DropdownItem href="/account/addresses">
            <MapPin />
            Addresses
          </DropdownItem>
          <DropdownItem href="/account/security">
            <Shield />
            Security
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            <LogOut />
            Sign out
          </DropdownItem>
        </DropdownMenu>
      ) : (
        <>
          <ButtonLink
            href="/login"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <LogIn />
            Sign in
          </ButtonLink>
          <ButtonLink
            href="/login"
            variant="ghost"
            size="icon"
            className="sm:hidden"
          >
            <LogIn />
            <span className="sr-only">Sign in</span>
          </ButtonLink>
          <ButtonLink
            href="/register"
            size="sm"
            className="hidden md:inline-flex"
          >
            Register
          </ButtonLink>
        </>
      )}
    </div>
  );
}
