import { cn } from "@/lib/utils";
import type {
  Pricing,
  PriceRange as PriceRangeShape,
  PriceTier,
} from "@/services/catalog";

/*
 * One price component, used by the card and the detail page.
 *
 * Cards and detail pages quoting different figures is the failure the pricing
 * phase is arranged to prevent, and it is just as easy to introduce in two
 * pieces of JSX as in two service methods. Everything that shows money for a
 * variant renders through here (engineering rule 41).
 *
 * The struck-through figure is `base`, not `compare_price`: base is what this
 * shopper would otherwise pay today, which is the honest comparison.
 */

const CURRENCY = "BDT";

/** Thousands separators, without touching the decimal string's precision. */
export function formatMoney(amount: string, currency = CURRENCY): string {
  const [whole, frac = "00"] = amount.split(".");

  return `${currency} ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

export function Price({
  pricing,
  fallback,
  size = "base",
  className,
}: {
  pricing: Pricing | undefined;
  /** The base column, for a payload that predates resolution. */
  fallback?: string;
  size?: "sm" | "base" | "lg";
  className?: string;
}) {
  const effective = pricing?.effective ?? fallback;

  if (!effective) return <span className="text-muted-foreground">—</span>;

  const sizes = {
    sm: "text-sm",
    base: "text-base",
    lg: "font-display text-3xl",
  } as const;

  return (
    <span
      className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}
    >
      <span className={cn("font-semibold tabular-nums", sizes[size])}>
        {formatMoney(effective)}
      </span>

      {pricing?.is_discounted && (
        <>
          <span className="text-muted-foreground text-sm line-through tabular-nums">
            {formatMoney(pricing.base)}
          </span>
          {pricing.savings && (
            <span className="bg-sale text-sale-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
              Save {formatMoney(pricing.savings)}
            </span>
          )}
        </>
      )}
    </span>
  );
}

/**
 * "From X" through "to Y" for a card, already resolved server-side.
 *
 * The struck-through figure is `base_min` against `min` — the same variant's
 * before and after, which is why the API sends both ends of both ranges rather
 * than leaving a card to pair the cheapest sale price with the dearest list
 * price and overstate the saving.
 */
export function PriceRange({
  range,
  className,
}: {
  range: PriceRangeShape | null | undefined;
  className?: string;
}) {
  if (!range) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <span
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 text-sm font-semibold tabular-nums",
        className,
      )}
    >
      <span>{span(range.min, range.max)}</span>

      {range.is_discounted && (
        <span className="text-muted-foreground text-xs font-normal line-through">
          {span(range.base_min, range.base_max)}
        </span>
      )}
    </span>
  );
}

/** One figure when both ends agree, a range when they do not. */
function span(min: string, max: string): string {
  return min === max
    ? formatMoney(min)
    : `${formatMoney(min)} – ${formatMoney(max).replace(`${CURRENCY} `, "")}`;
}

/**
 * Quantity breaks.
 *
 * Shown only when the variant has them; a table with one row would imply a
 * bulk deal that does not exist.
 */
export function PriceTiers({ tiers }: { tiers: PriceTier[] | undefined }) {
  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <p className="bg-muted/60 border-border border-b px-4 py-2.5 text-sm font-medium">
        Buy more, pay less
      </p>
      <table className="w-full text-sm">
        <tbody className="divide-border divide-y">
          {tiers.map((tier) => (
            <tr key={tier.min_quantity}>
              <td className="text-muted-foreground px-4 py-2">
                {tier.min_quantity}+ units
              </td>
              <td className="px-4 py-2 text-right font-medium tabular-nums">
                {formatMoney(tier.amount)} each
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
