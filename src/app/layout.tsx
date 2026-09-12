import type { Metadata } from "next";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { BootScript } from "@/components/ui/boot-script";
import "./globals.css";

/*
 * Fonts are self-hosted by next/font at build time: no request to Google at
 * runtime, no render-blocking stylesheet, and no layout shift, because the
 * metrics of a local fallback are matched automatically.
 *
 * Two families with one job each - a display face for headings and price, a
 * text face for everything else. `globals.css` maps them onto --font-display
 * and --font-sans; nothing else in the app names a typeface.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Store",
    template: "%s | Store",
  },
  description: "E-commerce storefront",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The boot script rewrites this element's class before React hydrates,
      // which is the whole point of it - so the mismatch it creates is
      // expected rather than a bug worth warning about.
      suppressHydrationWarning
      // globals.css sets `scroll-behavior: smooth` so in-page anchors glide.
      // Without this attribute the router inherits that for route changes too,
      // and a navigation animates its scroll instead of jumping — which reads
      // as "the link did nothing" on a long page. Declaring it hands the
      // router back control of transition scrolling while anchors keep the
      // smooth behaviour.
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${plusJakarta.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <BootScript />
      </head>
      <body className="flex min-h-full flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
