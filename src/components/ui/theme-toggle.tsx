"use client";

import { Moon, Sun } from "lucide-react";
import {
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/components/ui/boot-script";
import { useStoredValue, writeStored } from "@/lib/browser-store";
import { cn } from "@/lib/utils";

const LABELS: Record<ThemePreference, string> = {
  light: "Switch to dark theme",
  dark: "Switch to light theme",
};

/**
 * Light by default, dark on request.
 *
 * Two states, not three: the "system" option is gone because the shop no
 * longer follows the visitor's OS at all — see the note on `ThemePreference`.
 * A control that offered "match system" while the page ignored the system
 * would be lying about what it does.
 *
 * The theme itself is applied by the inline boot script long before this
 * component exists; this only reads and writes the stored preference.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const stored = useStoredValue(THEME_STORAGE_KEY);

  // `undefined` means the server is rendering, where localStorage cannot be
  // read. Light is the default, so assuming it here is also the truth.
  const known = stored !== undefined;
  const theme: ThemePreference = stored === "dark" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => {
        const next: ThemePreference = theme === "dark" ? "light" : "dark";

        writeStored(THEME_STORAGE_KEY, next === "dark" ? "dark" : null);
        document.documentElement.classList.toggle("dark", next === "dark");
        document.documentElement.style.colorScheme = next;
      }}
      title={LABELS[theme]}
      aria-label={LABELS[theme]}
      aria-pressed={theme === "dark"}
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-10 items-center justify-center rounded-full transition-colors",
        className,
      )}
    >
      {theme === "dark" ? (
        <Moon className={cn("size-5", !known && "opacity-0")} />
      ) : (
        <Sun className={cn("size-5", !known && "opacity-0")} />
      )}
    </button>
  );
}
