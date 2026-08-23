"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext } from "react";
import useSWR from "swr";
import { ApiError } from "@/lib/api";
import { platformService, type PlatformUser } from "@/services/platform";

/**
 * Session state for the Super Admin Portal.
 *
 * Separate from the storefront/tenant AuthProvider, and deliberately so: the
 * two are different identities on different hosts with different session
 * cookies. Sharing one provider would invite exactly the confusion the backend
 * spends two middlewares preventing.
 */
interface PlatformAuthValue {
  user: PlatformUser | null;
  loading: boolean;
  setUser: (user: PlatformUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthValue | null>(null);

export function PlatformAuthProvider({ children }: { children: React.ReactNode }) {
  const {
    data: user,
    isLoading,
    mutate,
  } = useSWR<PlatformUser | null>(
    "/platform/me",
    async () => {
      try {
        return await platformService.me();
      } catch (error) {
        // 401 means "not signed in", which is a state rather than a failure.
        if (error instanceof ApiError && error.isUnauthenticated) {
          return null;
        }
        throw error;
      }
    },
    { shouldRetryOnError: false, revalidateOnFocus: false, fallbackData: null },
  );

  const setUser = useCallback(
    (next: PlatformUser | null) => {
      void mutate(next, { revalidate: false });
    },
    [mutate],
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const logout = useCallback(async () => {
    try {
      await platformService.logout();
    } finally {
      // Clear locally even if the call failed: whatever the server thinks,
      // this browser should stop showing a signed-in portal.
      setUser(null);
    }
  }, [setUser]);

  return (
    <PlatformAuthContext.Provider
      value={{ user: user ?? null, loading: isLoading, setUser, refresh, logout }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth(): PlatformAuthValue {
  const context = useContext(PlatformAuthContext);

  if (!context) {
    throw new Error("usePlatformAuth must be used inside a PlatformAuthProvider");
  }

  return context;
}

/**
 * Client-side guard, for UX only. Every rule it appears to enforce is enforced
 * again by the API.
 */
export function RequirePlatformAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = usePlatformAuth();
  const router = useRouter();

  if (loading) {
    return <p className="text-muted-foreground p-6 text-sm">Loading…</p>;
  }

  if (!user) {
    router.replace("/super-admin/login");

    return null;
  }

  return <>{children}</>;
}
