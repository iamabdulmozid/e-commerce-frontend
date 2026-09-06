"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import {
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/components/ui/boot-script";
import { useStoredValue, writeStored } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

const ORDER: ThemePreference[] = ["system", "light", "dark"];

const LABELS: Record<ThemePreference, string> = {
  system: "Match system theme",
  light: "Light theme",
  dark: "Dark theme",
};

const ICONS: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Cycles system -> light -> dark.
 *
 * "System" is a real third state, not a default that disappears the moment you
 * touch the control: a shopper whose laptop turns dark at sunset should see
 * the shop turn dark too, and that is only possible if the preference is
 * allowed to stay unset.
 *
 * The theme itself is applied by the inline script in <head> long before this
 * component exists; this only reads and writes the stored preference.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const stored = useStoredValue(THEME_STORAGE_KEY);
  const known = stored !== undefined;
  const preference = (known ? (stored as ThemePreference | null) : null) ?? "system";

  // While the preference is "system", the OS can still change under us. This
  // is a subscription, which is what effects are for.
  useEffect(() => {
    if (preference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");

    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const Icon = ICONS[preference];

  return (
    <button
      type="button"
      onClick={() => {
        const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];

        writeStored(THEME_STORAGE_KEY, next === "system" ? null : next);
        apply(next);
      }}
      title={LABELS[preference]}
      aria-label={LABELS[preference]}
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-10 items-center justify-center rounded-full transition-colors",
        className,
      )}
    >
      {/* Invisible until the stored preference is readable, so the icon never
          contradicts the theme already painted on screen. */}
      <Icon className={cn("size-5", !known && "opacity-0")} />
    </button>
  );
}
