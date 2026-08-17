"use client";

import { createContext, useCallback, useContext } from "react";
import useSWR from "swr";
import { ApiError } from "@/lib/api";
import { authService } from "@/services/auth";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  /** True until the initial session check finishes. */
  loading: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state comes from SWR rather than a useEffect: React 19 discourages
 * setState inside effects (cascading renders), and SWR additionally gives us
 * request de-duplication and revalidation for free.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    data: user,
    isLoading,
    mutate,
  } = useSWR<User | null>(
    "/me",
    async () => {
      try {
        return await authService.me();
      } catch (error) {
        // 401 simply means "not signed in" — not an error worth surfacing.
        if (error instanceof ApiError && error.isUnauthenticated) {
          return null;
        }
        throw error;
      }
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      fallbackData: null,
    },
  );

  const setUser = useCallback(
    (next: User | null) => {
      void mutate(next, { revalidate: false });
    },
    [mutate],
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const logout = useCallback(async () => {
    try {
      await (user?.type === "admin"
        ? authService.adminLogout()
        : authService.logout());
    } finally {
      await mutate(null, { revalidate: false });
    }
  }, [user?.type, mutate]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isLoading,
        setUser,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}
