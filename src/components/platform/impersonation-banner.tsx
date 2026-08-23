"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";

interface ImpersonationContext {
  active: boolean;
  platform_user: string | null;
  started_at: string | null;
  reason: string | null;
  expires_in_minutes: number;
}

/**
 * Shown inside a tenant's admin dashboard while somebody from the platform is
 * driving it.
 *
 * Deliberately loud and impossible to miss: the store owner may be looking
 * over a shoulder, and anyone acting here should be constantly aware they are
 * not themselves.
 */
export function ImpersonationBanner() {
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  const { data } = useSWR<ImpersonationContext | null>(
    "/me#impersonation",
    async () => {
      const me = await api.get<{ impersonation?: ImpersonationContext }>("/me");

      return me.impersonation ?? null;
    },
    { shouldRetryOnError: false, revalidateOnFocus: false },
  );

  if (!data?.active) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 bg-violet-600 px-6 py-2 text-sm text-white"
    >
      <span>
        Viewing as this store, impersonated by{" "}
        <strong>{data.platform_user ?? "platform staff"}</strong>
        {data.reason ? ` — ${data.reason}` : ""}
        <span className="ml-2 opacity-80">
          ({data.expires_in_minutes} min remaining)
        </span>
      </span>

      <button
        className="shrink-0 rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
        disabled={ending}
        onClick={async () => {
          setEnding(true);

          try {
            await api.delete("/auth/impersonate");
          } finally {
            // The tenant session is gone either way; send them somewhere that
            // does not assume they are still signed in.
            router.push("/admin/login");
          }
        }}
      >
        {ending ? "Exiting…" : "Exit impersonation"}
      </button>
    </div>
  );
}
