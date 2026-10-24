import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const bricolage = localFont({
  src: [
    {
      path: "../../public/fonts/BricolageGrotesque-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/BricolageGrotesque-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-bricolage",
  display: "swap",
  // next/font otherwise appends a metric-adjusted local fallback ("bricolage
  // Fallback", backed by Arial) to this variable. Because that fallback is a
  // real font that *does* carry Arabic glyphs, it swallowed every Arabic
  // character before the display stack could reach the Arabic face — Arabic
  // headings rendered in Arial. Bricolage is Latin-only, so the stack in
  // tailwind/tokens.js supplies the Arabic and generic fallbacks instead.
  adjustFontFallback: false,
});
