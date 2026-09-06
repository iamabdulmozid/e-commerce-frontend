/**
 * The first focusable element on every page.
 *
 * Visually hidden until it has focus, at which point it becomes a normal
 * button. Without it, a keyboard user tabs through the whole header - logo,
 * every category, search, account menu - before reaching the content, on every
 * single page (PRD 5A rule 9).
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="bg-primary text-primary-foreground sr-only rounded-lg px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60]"
    >
      Skip to content
    </a>
  );
}
