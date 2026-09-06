import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * One button, two elements.
 *
 * `Button` is a <button> and `ButtonLink` is an <a>, and they are deliberately
 * separate rather than one component with an `href` prop. A link that looks
 * like a button is still a link: it must survive a middle-click, a bookmark
 * and a crawler. Styling an <a> as a button is fine; making a <button>
 * navigate is not.
 */

const button = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap",
    "transition-colors duration-[--duration-fast]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    // Icons inside a button should never be tab stops or shrink under a long
    // label.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent border border-border",
        outline: "border border-border bg-transparent hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // 40px minimum touch target at every size (PRD 5A rule 11).
        sm: "h-10 px-3 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-4",
        lg: "h-12 px-7 text-base [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-5",
      },
      full: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonVariants = VariantProps<typeof button>;

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    ButtonVariants {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  full,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(button({ variant, size, full }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* The label stays put while loading. Swapping it for "Please wait…"
          resizes the button mid-click, which is how a double submit happens. */}
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

interface ButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "color">,
    ButtonVariants {}

export function ButtonLink({
  className,
  variant,
  size,
  full,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(button({ variant, size, full }), className)}
      {...props}
    />
  );
}

export { button as buttonVariants };
