import { Input } from "@/components/ui/input";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Guidance shown under the label; hidden once an error replaces it. */
  hint?: string;
  icon?: React.ReactNode;
}

export function Field({
  label,
  error,
  hint,
  icon,
  id,
  className,
  ...props
}: FieldProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="flex items-center gap-1 text-sm font-medium"
      >
        {label}
        {props.required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </label>

      {hint && !error && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}

      <Input
        id={inputId}
        icon={icon}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={className}
        {...props}
      />

      {error && (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

// Re-exported so the auth and account screens keep their existing import.
export { FormAlert } from "@/components/ui/alert";
