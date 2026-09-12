"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A countdown to a deadline the server set.
 *
 * Three things make this harder than `setInterval` and a subtraction.
 *
 * **Hydration.** The page is server-rendered, so "how long is left" is a
 * different number on the server than in the browser a second later, and React
 * would report a mismatch. So the first paint deliberately renders no digits
 * at all — a set of placeholder cells at the right size — and the real figure
 * appears on the client's first tick. The layout does not shift, and nothing
 * that depends on the visitor's clock is ever server-rendered.
 *
 * **The visitor's clock.** The deadline arrives as an absolute instant in
 * UTC, and the remaining time is computed from `Date.now()`. A shopper whose
 * device is set to the wrong timezone still sees the correct duration, because
 * two absolute instants subtract to the same interval everywhere. That is the
 * whole reason the API sends ISO-8601 rather than "ends in 6 hours".
 *
 * **Expiry.** When the clock runs out the offer is genuinely over, and the
 * component says so rather than counting into negative numbers or freezing at
 * zero. `onExpire` lets the page around it react — the storefront uses it to
 * refresh, so a shopper who leaves a tab open overnight does not sit in front
 * of a sale that ended.
 */

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingUntil(deadline: number): Remaining | null {
  const ms = deadline - Date.now();

  if (ms <= 0) return null;

  const total = Math.floor(ms / 1000);

  return {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
}

export function Countdown({
  endsAt,
  onExpire,
  tone = "band",
  className,
}: {
  /** ISO-8601, from the API. */
  endsAt: string;
  onExpire?: () => void;
  /** `band` sits on the coloured sale panel; `page` on the page's own ground. */
  tone?: "band" | "page";
  className?: string;
}) {
  const deadline = new Date(endsAt).getTime();

  // Null means "not yet measured" on the first render and "expired" after the
  // clock runs out. `expired` separates the two, so the placeholder is never
  // mistaken for an ended sale.
  const [left, setLeft] = useState<Remaining | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // An invalid date would tick forever against NaN and render "NaN:NaN".
    if (Number.isNaN(deadline)) return;

    const tick = () => {
      const next = remainingUntil(deadline);

      setLeft(next);
      setExpired(next === null);
    };

    // Immediately, then every second: waiting a full second before the first
    // measurement leaves the placeholder up for a visible beat.
    tick();

    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [deadline]);

  // Fired from its own effect rather than from inside the tick, so the parent
  // is notified once on the transition rather than once per second afterwards,
  // and never during another component's render.
  useEffect(() => {
    if (expired) onExpire?.();
  }, [expired, onExpire]);

  if (expired) {
    return (
      <p className={cn("text-sm font-semibold", className)}>
        This sale has ended
      </p>
    );
  }

  const cells: Array<[string, number | null]> = [
    ["Days", left?.days ?? null],
    ["Hrs", left?.hours ?? null],
    ["Min", left?.minutes ?? null],
    ["Sec", left?.seconds ?? null],
  ];

  // Days are dropped once there are none left, so a sale ending this afternoon
  // reads "04 : 12 : 39" instead of leading with a permanent "00".
  const visible = left && left.days === 0 ? cells.slice(1) : cells;

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      /*
       * One label for the whole group, and the digits themselves hidden from
       * assistive tech. A live region ticking every second would read the
       * seconds aloud forever, which is unusable; a shopper who wants the
       * figure can read the label.
       */
      role="timer"
      aria-label={
        left
          ? `Offer ends in ${left.days > 0 ? `${left.days} days, ` : ""}${left.hours} hours and ${left.minutes} minutes`
          : "Offer countdown"
      }
    >
      {visible.map(([label, value]) => (
        <Cell key={label} label={label} value={value} tone={tone} />
      ))}
    </div>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "band" | "page";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex min-w-11 flex-col items-center rounded-lg px-2 py-1.5",
        /*
         * A translucent tint of the band's own foreground rather than a fixed
         * white: the cell then lifts off whatever the sale tokens are set to,
         * including a retuned brand, instead of assuming the ground is dark
         * amber. On the page the same idea in the page's own ink.
         */
        tone === "band"
          ? "bg-sale-band-foreground/15 text-sale-band-foreground backdrop-blur-sm"
          : "bg-foreground/5 text-foreground",
      )}
    >
      {/*
       * `tabular-nums` is not decoration here: without it every digit change
       * re-measures the box and the whole row jitters once a second.
       */}
      <span className="font-display text-lg leading-none font-bold tabular-nums">
        {value === null ? "––" : String(value).padStart(2, "0")}
      </span>
      <span
        className={cn(
          "mt-1 text-[0.5625rem] font-semibold tracking-[0.08em] uppercase",
          tone === "band" ? "opacity-75" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
