/**
 * Everything that must be read out of localStorage before the first paint.
 *
 * Two things qualify, and they qualify for the same reason: both decide what
 * the very first frame looks like, and neither is knowable on the server.
 * Deciding them in a React effect instead means one painted frame that is
 * wrong — the theme flashes light, and the announcement bar drops in and
 * shoves the page down (PRD 5A rules 3 and 7).
 *
 * So this is a small synchronous script in <head>. It sets classes on <html>;
 * CSS and the components take it from there. This is the one place in the app
 * where inline script is the right answer.
 */

export const THEME_STORAGE_KEY = "theme";

export const ANNOUNCEMENT_DISMISSED_KEY = "announcement-dismissed";

/** Set on <html> when the shopper has closed the announcement bar. */
export const ANNOUNCEMENT_HIDDEN_CLASS = "announcement-dismissed";

/**
 * Light unless the shopper explicitly asked for dark.
 *
 * There is deliberately no "system" any more. Following `prefers-color-scheme`
 * means the visitor's laptop decides what the merchant's shop looks like, and
 * for a store that is the wrong input: catalogue photography is shot against
 * light grounds, surrounding chrome shifts how a product's colour is judged,
 * and two shoppers seeing materially different stores is a branding defect —
 * one that gets worse when tenants pick their own brand colour, since they
 * will pick it against a light page.
 *
 * Dark stays available for anyone who wants it; it is just never chosen on
 * someone's behalf.
 */
export type ThemePreference = "light" | "dark";

const script = `
(function () {
  var root = document.documentElement;

  try {
    var dark =
      localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "dark";

    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";

    if (localStorage.getItem(${JSON.stringify(ANNOUNCEMENT_DISMISSED_KEY)}) === "1") {
      root.classList.add(${JSON.stringify(ANNOUNCEMENT_HIDDEN_CLASS)});
    }
  } catch (e) {
    /* Private mode can throw on localStorage. The defaults are all fine. */
  }
})();
`;

export function BootScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
