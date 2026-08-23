"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-semibold">
            Store
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/products" className="underline">
              Products
            </Link>
            <Link href="/categories" className="underline">
              Categories
            </Link>
            <Link href="/brands" className="underline">
              Brands
            </Link>

            {loading ? null : user ? (
              <Link href="/account" className="underline">
                {user.name}
              </Link>
            ) : (
              <>
                <Link href="/login" className="underline">
                  Sign in
                </Link>
                <Link href="/register" className="underline">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>
    </>
  );
}
