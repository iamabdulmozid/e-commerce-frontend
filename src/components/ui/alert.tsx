import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "info" | "warning";

const tones: Record<Tone, { classes: string; Icon: LucideIcon; role: string }> =
  {
    error: {
      classes: "border-destructive/30 bg-destructive-soft text-destructive",
      Icon: XCircle,
      role: "alert",
    },
    success: {
      classes: "border-success/30 bg-success-soft text-success",
      Icon: CheckCircle2,
      role: "status",
    },
    info: {
      classes: "border-primary/30 bg-primary-soft text-primary-soft-foreground",
      Icon: Info,
      role: "status",
    },
    warning: {
      classes: "border-warning/40 bg-warning-soft text-warning-foreground",
      Icon: AlertTriangle,
      role: "status",
    },
  };

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { classes, Icon, role } = tones[tone];

  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        classes,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}

/**
 * The form-level message shape the auth and account screens already use.
 * Kept as its own export so those call sites did not have to change.
 */
export function FormAlert({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "success";
}) {
  return <Alert tone={tone}>{message}</Alert>;
}
