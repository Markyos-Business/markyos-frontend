"use client";

import { useAccountCopy } from "@/contexts/useAccountCopy";
import { useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { LangToggle, Row, Section, useToast } from "@/components/ui";
import { InputField } from "@/components/ui";
import type { Workspace } from "@/types";
import { BrandDetails } from "./brand-details";

/**
 * Brand — the name lives here because this is where people look for it. It was
 * only editable behind a pen icon inside a card on Overview, which is a fine
 * shortcut and a bad only-route.
 */
export function BrandSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { setPrimaryLocale } = useAppActions();
  const { showToast } = useToast();
  const copy = useAccountCopy(isAr);
  return (
    <Section title={isAr ? "العلامة" : "Brand"} icon="shapes">
      <BrandNameRow ws={ws} isAr={isAr} />
      <BrandDetails ws={ws} isAr={isAr} />
      {/* The brand's own language, which is a different thing from the one the
          studio reads the app in — that is a personal setting and lives in the
          top bar. It is an Owner-level decision about the deliverable: it
          decides which language the client's site opens in. */}
      <Row
        label={isAr ? "لغة الهوية" : "Brand language"}
        /* "On the next publish", not "now": /v/<slug> serves the published
           snapshot and never the live workspace. */
        hint={
          copy.brandLanguageHint
        }
        right={
          <LangToggle
            value={ws.primaryLocale}
            onChange={(lang) => {
              if (lang === ws.primaryLocale) return;
              setPrimaryLocale(ws.id, lang);
              showToast(
                lang === "ar" ? copy.brandLanguageArabic : copy.brandLanguageEnglish,
              );
            }}
            label={isAr ? "لغة الهوية" : "Brand language"}
            scope="brand"
          />
        }
      />
    </Section>
  );
}

/**
 * Renaming the brand.
 *
 * Saved on blur or Enter rather than per keystroke: every edit bumps the
 * workspace and marks the guideline as having unpublished changes.
 *
 * The slug deliberately does not follow. It is the client-facing URL and may
 * already be in a proposal, so a typo fix must not silently break a link
 * someone has already shared — the hint says so.
 */
function BrandNameRow({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { renameWorkspace } = useAppActions();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(ws.name);

  function commit() {
    const next = draft.trim();
    if (!next) {
      setDraft(ws.name);
      return;
    }
    if (next === ws.name) return;
    renameWorkspace(ws.id, next);
    showToast(isAr ? `أُعيدت التسمية إلى ${next}. رابط الدليل المشترك لم يتغير.` : `Renamed to ${next}. The shared guideline link is unchanged.`, "success");
  }

  return (
    <div className="flex flex-col gap-field-stack-compact">
      <InputField
        label={t("Brand name", "اسم العلامة")}
        value={draft}
        dir="auto"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(ws.name);
        }}
        placeholder={t("e.g. Nadeen Studio", "مثل: استوديو نادين")}
      />
      <span className="px-space-5 text-[12px] text-text-faint">
        {t("Shown across the app and on the published guideline. Its shared link stays", "يظهر في التطبيق وفي موقع الدليل المنشور. يبقى الرابط المشترك")}{" "}
        {/* bdi, not a dir'd span: a span doesn't isolate, so the slashes and
            the full stop around it jumped sides in Arabic. */}
        <bdi dir="ltr" className="font-mono">/v/{ws.slug}</bdi>
        {t(", so renaming never breaks a link you've already shared.", "، فإعادة التسمية لا تكسر أي رابط شاركته من قبل.")}
      </span>
    </div>
  );
}
