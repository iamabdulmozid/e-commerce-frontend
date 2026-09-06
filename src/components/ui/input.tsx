import { cn } from "@/lib/utils";

/**
 * The shared control surface for every text-like input, select and textarea.
 *
 * Kept as a class string rather than a component wrapper so a <select> and a
 * <textarea> can wear it without pretending to be an <input>.
 */
export const controlClasses = [
  "w-full rounded-lg border border-input bg-card px-3 text-sm",
  "placeholder:text-muted-foreground",
  "transition-colors duration-[--duration-fast]",
  "hover:border-muted-foreground/40",
  "focus-visible:border-primary",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-[invalid=true]:border-destructive",
].join(" ");

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rendered inside the control, before the text. Decorative only. */
  icon?: React.ReactNode;
}

export function Input({ className, icon, ...props }: InputProps) {
  const input = (
    <input
      className={cn(controlClasses, "h-11", icon && "pl-10", className)}
      {...props}
    />
  );

  if (!icon) return input;

  return (
    <div className="relative">
      <span
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center [&_svg]:size-4"
      >
        {icon}
      </span>
      {input}
    </div>
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  // A native <select>: it is keyboard accessible, screen-reader correct and
  // uses the platform picker on mobile, none of which a hand-rolled listbox
  // gets for free.
  return <select className={cn(controlClasses, "h-11", className)} {...props} />;
}

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const inputId = id ?? props.name;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 py-1 text-sm select-none",
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className="border-input text-primary accent-primary size-4 rounded"
        {...props}
      />
      {label}
    </label>
  );
}
