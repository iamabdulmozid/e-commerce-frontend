import { PackageSearch, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

/**
 * The frame every storefront auth screen sits in.
 *
 * A single component rather than five nearly-identical page wrappers, so
 * sign-in, register, reset and verify cannot drift into four different
 * headings, widths and paddings.
 *
 * The side panel is decorative and hidden below `lg`: on a phone it would push
 * the form — the only thing anyone came here to use — below the fold.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Container className="py-10 lg:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl lg:grid-cols-2">
        <Card flush className="rounded-none p-7 sm:p-10 lg:rounded-l-2xl">
          <h1 className="text-2xl font-bold lg:text-3xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          )}

          <div className="mt-7 space-y-5">{children}</div>

          {footer && (
            <div className="border-border mt-7 border-t pt-5 text-sm">
              {footer}
            </div>
          )}
        </Card>

        <aside
          aria-hidden
          className="from-primary via-primary-hover to-primary text-primary-foreground hidden flex-col justify-center gap-7 bg-linear-to-br p-10 lg:flex"
        >
          <Sparkles className="size-8 opacity-80" />

          <p className="font-display text-2xl leading-snug font-bold">
            One account for everything you browse here.
          </p>

          <ul className="space-y-4 text-sm opacity-90">
            <Point icon={PackageSearch}>
              Keep your details ready so you never retype them.
            </Point>
            <Point icon={ShieldCheck}>
              Manage your addresses, password and active sessions in one place.
            </Point>
          </ul>
        </aside>
      </div>
    </Container>
  );
}

function Point({
  icon: Icon,
  children,
}: {
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
