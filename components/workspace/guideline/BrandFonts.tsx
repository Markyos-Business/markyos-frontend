"use client";

import { ReactNode } from "react";
import { BrandFontStacks, brandFontVars } from "@/lib/brandFonts";

/**
 * Puts the brand's own fonts on everything inside it.
 *
 * The templates set type with `var(--font-sans)`, `var(--font-arabic)` and
 * `var(--font-display)`. Those are the interface's faces; re-pointing them on a
 * wrapper is what carries an applied brand font through every heading, caption
 * and body line of the guideline at once — custom properties inherit, so no
 * template or block needs to know this happened.
 *
 * Mounted at the three places a guideline renders — the editing canvas and the
 * two published routes — rather than inside the templates, so the canvas and
 * the client's page can't end up set in different faces.
 */
export function BrandFonts({
  fonts,
  isAr,
  children,
}: {
  fonts: BrandFontStacks | undefined;
  isAr: boolean;
  children: ReactNode;
}) {
  if (!fonts || (!fonts.latinIsUploaded && !fonts.arabicIsUploaded)) return <>{children}</>;
  return (
    <>
      {/* The @font-face rules have to be document-level: a font declared inside
          a scoped rule is still resolved globally, and the files are data URLs
          already held in this page's state, so nothing is fetched. */}
      <style>{fonts.css}</style>
      <div style={brandFontVars(fonts, isAr)}>{children}</div>
    </>
  );
}
