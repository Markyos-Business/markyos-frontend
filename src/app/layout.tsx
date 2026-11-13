import type { Metadata } from "next";
import { inter, plexArabic, bricolage } from "./fonts";
import { AppProvider } from "@/contexts/AppContext";
import { ToastProvider, DialogProvider } from "@/components/ui";
import { SyncNotices } from "@/contexts/SyncNotices";
import { ThemeProvider } from "@/components/ui";
import { THEME_INIT_SCRIPT } from "@/lib/interfaceTheme";
import { PageTitleSync } from "@/contexts/PageTitleSync";
import { InterfaceLangSync } from "@/contexts/InterfaceLangSync";
import { InterfaceUiStrings } from "@/contexts/InterfaceUiStrings";
import { LANG_INIT_SCRIPT } from "@/lib/i18n/interfaceLang";
import { SIDEBAR_INIT_SCRIPT } from "@/lib/sidebarRails";
import "./tailwind.css";

export const metadata: Metadata = {
  description: "Brand books that work in both directions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      // Arabic first: the pre-paint script below switches to English before
      // anything draws when this browser or the website link chose it.
      lang="ar"
      dir="rtl"
      // The theme script below stamps data-theme before React hydrates, so the
      // server markup and the live document deliberately differ on this one
      // element. Suppressing here is the sanctioned way to say so; without it
      // React logs a hydration mismatch on every page load.
      suppressHydrationWarning
      // Smooth scrolling for in-page anchors (tailwind/base.js); this tells
      // Next to switch it off while it navigates, so a route change still
      // lands at the top at once.
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${plexArabic.variable} ${bricolage.variable} h-full`}
    >
      <head>
        {/* Stamps the theme before first paint. Without it the page renders
            in the default dark palette and visibly flips to light on hydration
            for anyone who chose light. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-canvas text-text">
        <ThemeProvider>
          <AppProvider>
            <InterfaceUiStrings>
              <ToastProvider>
                <SyncNotices />
                <InterfaceLangSync />
                <PageTitleSync />
                <DialogProvider>{children}</DialogProvider>
              </ToastProvider>
            </InterfaceUiStrings>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
