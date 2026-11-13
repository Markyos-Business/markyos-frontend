"use client";

import { useEffect, useState } from "react";
import { UiStringsProvider } from "@/components/ui";
import { SegmentedToggle } from "@/components/ui";
import { useTheme } from "@/components/ui";
import { STYLE_GUIDE_COPY } from "../../constants";
import { ChartsSection } from "./charts-section";
import { DataDisplaySection } from "./data-display-section";
import { FeedbackSection } from "./feedback-section";
import { InputsSection } from "./inputs-section";
import { LayoutSection } from "./layout-section";
import { TableSection } from "./table-section";

const SECTIONS = ["layout", "data", "charts", "table", "inputs", "feedback"] as const;

/**
 * The dashboard component library, live: every component in every variant
 * and state. The theme toggle switches the whole app's theme; the language
 * toggle sets `dir` and `lang` on this page and the kit's own words with it.
 */
const StyleGuide = () => {
  const { resolved, setChoice } = useTheme();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const isAr = lang === "ar";
  const c = STYLE_GUIDE_COPY[lang];

  // Toasts and dialogs sit at the document root; they take the direction
  // from <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", isAr ? "rtl" : "ltr");
    return () => root.removeAttribute("dir");
  }, [isAr]);

  return (
    <UiStringsProvider lang={lang}>
      <div dir={isAr ? "rtl" : "ltr"} lang={lang} className="min-h-screen bg-canvas text-text">
        <header className="sticky top-0 z-sticky flex flex-wrap items-center justify-between gap-space-5 bg-canvas px-space-6 py-space-4 shadow-rule-b sm:px-space-10">
          <h1 className="text-h4 font-medium">{c.title}</h1>
          <div className="flex flex-wrap items-center gap-space-5">
            <SegmentedToggle
              label={c.theme}
              off={{ label: c.light, icon: "sun" }}
              on={{ label: c.dark, icon: "moon" }}
              value={resolved === "dark"}
              onChange={(dark) => setChoice(dark ? "dark" : "light")}
            />
            <SegmentedToggle
              label={c.language}
              off={{ label: "English" }}
              on={{ label: "العربية" }}
              value={isAr}
              onChange={(ar) => setLang(ar ? "ar" : "en")}
            />
          </div>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-space-11 px-space-6 py-space-10 sm:px-space-10">
          <div className="flex flex-col gap-space-4">
            <p className="max-w-2xl text-text-muted">{c.intro}</p>
            <nav aria-label={c.title} className="flex flex-wrap gap-space-5">
              {SECTIONS.map((id) => (
                <a key={id} href={`#${id}`} className="text-ui font-medium">
                  {c.sections[id]}
                </a>
              ))}
            </nav>
          </div>
          <LayoutSection c={c} />
          <DataDisplaySection c={c} />
          <ChartsSection c={c} />
          <TableSection c={c} />
          <InputsSection c={c} />
          <FeedbackSection c={c} isAr={isAr} />
        </main>
      </div>
    </UiStringsProvider>
  );
};

export { StyleGuide };
