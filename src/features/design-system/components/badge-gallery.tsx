"use client";

import { useState } from "react";
import { ChipSelector, PublicPageShell, SegmentedControl, SegmentedToggle, ThemeToggle, ToggleField, UiStringsProvider } from "@/components/ui";
import type { BadgePageType } from "@/components/ui";

const TYPES: BadgePageType[] = ["form", "moodboard", "guide", "other"];

/**
 * The Made with Markyos badge on a sample public page: each page type, the
 * three themes, both languages, and a page with its own fixed bottom bar. A
 * dev page at /design-system/badge (NEXT_PUBLIC_UI_GALLERY=1).
 */
const BadgeGallery = () => {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [pageType, setPageType] = useState<BadgePageType>("form");
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("auto");
  const [fixedBar, setFixedBar] = useState(false);
  const isAr = lang === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <UiStringsProvider lang={lang}>
      <PublicPageShell key={`${lang}-${pageType}-${theme}`} showBadge pageType={pageType} locale={lang} theme={theme} pageId="demo-page" workspaceId="demo-brand">
        <main lang={lang} dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-canvas text-text">
          <div className="mx-auto flex max-w-2xl flex-col gap-space-8 px-space-6 py-space-10">
            <div className="flex flex-wrap items-center justify-between gap-space-4">
              <h1 className="text-h3 font-medium">{t("A free brand's public page", "صفحة عامة لعلامة مجانية")}</h1>
              <div className="flex items-center gap-space-4">
                <SegmentedToggle label={t("Language", "اللغة")} off={{ label: "English" }} on={{ label: "العربية" }} value={isAr} onChange={(ar) => setLang(ar ? "ar" : "en")} />
                <ThemeToggle isAr={isAr} />
              </div>
            </div>
            <ChipSelector label={t("Page type", "نوع الصفحة")} options={TYPES.map((v) => ({ value: v, label: v }))} value={pageType} onChange={setPageType} />
            <SegmentedControl label={t("Badge theme", "سمة الشارة")} options={[{ value: "auto", label: "auto" }, { value: "light", label: "light" }, { value: "dark", label: "dark" }]} value={theme} onChange={setTheme} />
            <ToggleField label={t("Fixed bottom bar", "شريط سفلي ثابت")} description={t("Like a form's submit bar: the badge sits 8px above it.", "مثل شريط إرسال النموذج: تجلس الشارة فوقه بـ 8 بكسل.")} checked={fixedBar} onChange={setFixedBar} />
            {Array.from({ length: 8 }, (_, i) => (
              <p key={i} className="text-body text-text-muted">
                {t(
                  "Ramadan nights in Riyadh: lanterns, dates and the smell of qahwa. This paragraph is the page's content, long enough to scroll so the last line can be checked against the badge.",
                  "ليالي رمضان في الرياض: فوانيس وتمر ورائحة القهوة. هذه الفقرة محتوى الصفحة، طويلة بما يكفي للتمرير للتحقق من آخر سطر مقابل الشارة."
                )}
              </p>
            ))}
            <p id="last-line" className="text-body font-medium">
              {t("The last line of the page.", "آخر سطر في الصفحة.")}
            </p>
          </div>
          {fixedBar && (
            <div data-fixed-bottom className="fixed inset-x-0 bottom-0 z-10 flex justify-center bg-surface-1 px-space-6 py-space-5 shadow-rule-t">
              <button type="button" className="rounded-lg bg-accent px-space-8 py-space-3 text-body font-medium text-accent-ink">
                {t("Submit answers", "إرسال الإجابات")}
              </button>
            </div>
          )}
        </main>
      </PublicPageShell>
    </UiStringsProvider>
  );
};

export { BadgeGallery };
