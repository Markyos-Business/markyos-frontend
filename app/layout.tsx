import type { Metadata } from "next";
import { inter, plexArabic, bricolage } from "./fonts";
import { AppProvider } from "@/core/store/store";
import { ToastProvider, DialogProvider } from "@/shared/ui";
import { SyncNotices } from "@/core/providers/SyncNotices";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/core/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markyos",
  description: "Brand books that work in both directions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme script below stamps data-theme before React hydrates, so the
      // server markup and the live document deliberately differ on this one
      // element. Suppressing here is the sanctioned way to say so; without it
      // React logs a hydration mismatch on every page load.
      suppressHydrationWarning
      className={`${inter.variable} ${plexArabic.variable} ${bricolage.variable} h-full`}
    >
      <head>
        {/* Stamps the theme before first paint. Without it the page renders
            in the default dark palette and visibly flips to light on hydration
            for anyone who chose light. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-canvas text-text">
        <ThemeProvider>
          <AppProvider>
            <ToastProvider>
              <SyncNotices />
              <DialogProvider>{children}</DialogProvider>
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
