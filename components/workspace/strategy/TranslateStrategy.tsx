"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { richIsEmpty } from "@/components/RichText";
import { TranslateDirection, translateHtml, translateText } from "@/lib/translate";
import { StrategyTextField, Workspace } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

/**
 * Fills one language copy of the strategy from the other.
 *
 * The result is a draft, and the UI says so at every step: a progress count
 * while it runs, a flag on every field it wrote, and a banner that stays until
 * someone has read them. Brand strategy is the most carefully-worded document
 * a studio produces — machine Arabic is a good first pass and a bad final
 * answer, and the interface should not let anyone forget which one they have.
 */

const NARRATIVE: StrategyTextField[] = [
  "purpose",
  "vision",
  "mission",
  "targetAudienceSummary",
  "positioningStatement",
  "uvp",
];

/** Purpose is one plain sentence; the rest hold rich text. */
const PLAIN: StrategyTextField[] = ["purpose"];

export function TranslateStrategy({
  ws,
  direction,
  isAr,
}: {
  ws: Workspace;
  /** Which way round: filling Arabic from English, or the reverse. */
  direction: TranslateDirection;
  isAr: boolean;
}) {
  const {
    setStrategyText,
    setStrategyTranslation,
    updatePersona,
    updateVoiceTrait,
    updateCoreValue,
    updateCompetitor,
  } = useApp();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const toArabic = direction === "en-ar";
  const t = ws.strategyTranslation;

  /** Every piece of text that needs translating, as a list of jobs. */
  function buildJobs(): (() => Promise<string | null>)[] {
    const jobs: (() => Promise<string | null>)[] = [];
    const s = ws.strategy;

    for (const field of NARRATIVE) {
      const from = toArabic ? s[field] : (s[`${field}Ar` as keyof typeof s] as string | undefined);
      if (!from || (PLAIN.includes(field) ? !from.trim() : richIsEmpty(from))) continue;
      jobs.push(async () => {
        const out = PLAIN.includes(field)
          ? await translateText(from, direction)
          : await translateHtml(from, direction);
        setStrategyText(ws.id, field, out, toArabic ? "ar" : "en");
        return toArabic ? `${field}Ar` : field;
      });
    }

    for (const p of s.personas) {
      const src = toArabic ? p : { name: p.nameAr, role: p.roleAr, description: p.descriptionAr };
      if (!src.name && !src.role && !src.description) continue;
      jobs.push(async () => {
        const [name, role, description] = await Promise.all([
          translateText(src.name ?? "", direction),
          translateText(src.role ?? "", direction),
          translateText(src.description ?? "", direction),
        ]);
        updatePersona(ws.id, p.id, toArabic ? { nameAr: name, roleAr: role, descriptionAr: description } : { name, role, description });
        return `persona:${p.id}`;
      });
    }

    for (const v of s.coreValues) {
      const src = toArabic ? v : { title: v.titleAr, description: v.descriptionAr };
      if (!src.title && !src.description) continue;
      jobs.push(async () => {
        const [title, description] = await Promise.all([
          translateText(src.title ?? "", direction),
          translateText(src.description ?? "", direction),
        ]);
        updateCoreValue(ws.id, v.id, toArabic ? { titleAr: title, descriptionAr: description } : { title, description });
        return `value:${v.id}`;
      });
    }

    for (const tr of s.voiceTraits) {
      const src = toArabic ? tr : { trait: tr.traitAr, doExample: tr.doExampleAr, dontExample: tr.dontExampleAr };
      if (!src.trait && !src.doExample && !src.dontExample) continue;
      jobs.push(async () => {
        const [trait, doExample, dontExample] = await Promise.all([
          translateText(src.trait ?? "", direction),
          translateText(src.doExample ?? "", direction),
          translateText(src.dontExample ?? "", direction),
        ]);
        updateVoiceTrait(
          ws.id,
          tr.id,
          toArabic ? { traitAr: trait, doExampleAr: doExample, dontExampleAr: dontExample } : { trait, doExample, dontExample }
        );
        return `trait:${tr.id}`;
      });
    }

    for (const c of s.competitors) {
      const srcName = toArabic ? c.name : c.nameAr;
      const srcNotes = toArabic ? c.notes : c.notesAr;
      if (!srcName && !srcNotes) continue;
      jobs.push(async () => {
        const [name, notes] = await Promise.all([
          translateText(srcName ?? "", direction),
          translateText(srcNotes ?? "", direction),
        ]);
        updateCompetitor(ws.id, c.id, toArabic ? { nameAr: name, notesAr: notes } : { name, notes });
        return `competitor:${c.id}`;
      });
    }

    return jobs;
  }

  async function run() {
    const jobs = buildJobs();
    if (jobs.length === 0) {
      showToast(
        isAr ? "لا يوجد محتوى لترجمته بعد." : "There's nothing written to translate yet.",
        "default"
      );
      return;
    }

    setBusy(true);
    setProgress({ done: 0, total: jobs.length });
    const written: string[] = [];
    try {
      // Sequential on purpose: the free endpoint rate-limits bursts, and
      // failing halfway through with half the strategy translated is worse
      // than being slower.
      for (let i = 0; i < jobs.length; i++) {
        const key = await jobs[i]();
        if (key) written.push(key);
        setProgress({ done: i + 1, total: jobs.length });
      }
      setStrategyTranslation(ws.id, {
        source: "machine",
        translatedAt: Date.now(),
        direction,
        unreviewed: written,
      });
      showToast(
        isAr
          ? `تمت ترجمة ${written.length} حقلًا — راجعها قبل النشر.`
          : `Translated ${written.length} field${written.length === 1 ? "" : "s"} — review before publishing.`,
        "success"
      );
    } catch (err) {
      // Whatever got through is kept: it is real translated content, and
      // throwing it away would mean spending the rate limit for nothing.
      if (written.length > 0) {
        setStrategyTranslation(ws.id, {
          source: "machine",
          translatedAt: Date.now(),
          direction,
          unreviewed: [...t.unreviewed, ...written],
        });
      }
      const reason = err instanceof Error ? err.message : isAr ? "تعذّرت الترجمة." : "Translation failed.";
      const salvaged =
        written.length === 0
          ? ""
          : isAr
            ? ` تمت ترجمة ${written.length} حقلًا قبل التوقف.`
            : ` ${written.length} field${written.length === 1 ? "" : "s"} were translated before it stopped.`;
      showToast(`${reason}${salvaged}`, "danger");
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="h-8 px-3.5 rounded-full text-[12.5px] font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 disabled:cursor-wait transition-colors"
        style={{ background: "var(--surface-2)", color: "var(--text)" }}
      >
        <Icon name={busy ? "circle-notch" : "language"} size={13} className={busy ? "mk-spin" : undefined} />
        {/* Names the destination as well as the source. This button overwrites
            the copy currently open, and "Translate from English" reads like it
            produces something new rather than replacing what is on screen. */}
        {busy
          ? `${progress.done}/${progress.total}`
          : toArabic
            ? isAr
              ? "املأ العربية من الإنجليزية"
              : "Fill Arabic from English"
            : isAr
              ? "املأ الإنجليزية من العربية"
              : "Fill English from Arabic"}
      </button>
    </div>
  );
}

/**
 * The standing reminder that some of this was written by a machine.
 *
 * It names the count and the moment rather than saying "some fields", because
 * "3 fields translated 2 hours ago" is something a person can act on and
 * "review your translations" is something they learn to dismiss.
 */
export function TranslationNotice({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const { setStrategyTranslation } = useApp();
  const t = ws.strategyTranslation;
  if (t.source !== "machine" || t.unreviewed.length === 0) return null;

  return (
    <div
      className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mk-fade-in"
      style={{ background: "var(--warning-soft, rgba(255,176,32,.12))", color: "var(--text)" }}
    >
      <Icon name="exclamation-circle" size={14} style={{ color: "var(--warning)", marginTop: 1, flexShrink: 0 }} />
      <div className="flex-1 min-w-0 text-[12.5px] leading-[1.55]">
        <span className="font-semibold">
          {isAr
            ? `${t.unreviewed.length} حقلًا مترجمة آليًا`
            : `${t.unreviewed.length} machine-translated field${t.unreviewed.length === 1 ? "" : "s"}`}
        </span>
        {t.translatedAt && (
          <span style={{ color: "var(--text-muted)" }}> · {formatRelative(t.translatedAt)}</span>
        )}
        <div style={{ color: "var(--text-muted)" }}>
          {isAr
            ? "هذه مسودة آلية — راجعها قبل تسليمها للعميل. التعديل على أي حقل يزيل العلامة عنه."
            : "This is a machine draft, not brand copy. Editing a field clears its flag."}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setStrategyTranslation(ws.id, { unreviewed: [] })}
        className="text-[12px] font-semibold cursor-pointer shrink-0 transition-opacity hover:opacity-70"
        style={{ color: "var(--accent-text)" }}
      >
        {isAr ? "راجعتها" : "Reviewed"}
      </button>
    </div>
  );
}
