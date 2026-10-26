"use client";

import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { LangToggle, Row, Section, useToast } from "@/components/ui";
import { InputField } from "@/components/form";
import type { Workspace } from "@/types";

/**
 * Brand — the name lives here because this is where people look for it. It was
 * only editable behind a pen icon inside a card on Overview, which is a fine
 * shortcut and a bad only-route.
 */
export function BrandSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { setPrimaryLocale } = useApp();
  const { showToast } = useToast();
  return (
    <Section title="Brand" icon="shapes">
      <BrandNameRow ws={ws} />
      {/* The brand's own language, which is a different thing from the one the
          studio reads the app in — that is a personal setting and lives in the
          top bar. It is an Owner-level decision about the deliverable: it
          decides which language the client's site opens in. */}
      <Row
        label={isAr ? "لغة الهوية" : "Brand language"}
        /* "On the next publish", not "now": /v/<slug> serves the published
           snapshot and never the live workspace. */
        hint={
          isAr
            ? "اللغة التي يفتح بها موقع الدليل عند العميل، عند النشر القادم. لغة واجهتك أنت إعداد منفصل في الشريط الأعلى."
            : "Which language the client's guideline opens in, from the next publish. Your own interface language is a separate setting in the top bar."
        }
        right={
          <LangToggle
            value={ws.primaryLocale}
            onChange={(lang) => {
              if (lang === ws.primaryLocale) return;
              setPrimaryLocale(ws.id, lang);
              showToast(
                isAr
                  ? lang === "ar"
                    ? "لغة الهوية: العربية. تصل إلى العميل عند النشر."
                    : "لغة الهوية: الإنجليزية. تصل إلى العميل عند النشر."
                  : lang === "ar"
                    ? "Brand language set to Arabic. Publish to show clients."
                    : "Brand language set to English. Publish to show clients.",
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
function BrandNameRow({ ws }: { ws: Workspace }) {
  const { renameWorkspace } = useApp();
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
    showToast(`Renamed to ${next}. The client link is unchanged.`, "success");
  }

  return (
    <div className="flex flex-col gap-2">
      <InputField
        label="Brand name"
        value={draft}
        dir="auto"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(ws.name);
        }}
        placeholder="e.g. Nadeen Studio"
      />
      <span className="text-[12px] text-text-faint">
        Shown across the app and on the client&apos;s guideline site. The client link stays <span className="font-mono">/v/{ws.slug}</span> — renaming never
        breaks a link you&apos;ve already shared.
      </span>
    </div>
  );
}
