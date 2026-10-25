"use client";

import { Badge, EmptyHint } from "@/components/ui";
import { InputField, SelectField } from "@/components/form";
import { KIND_META, LANGUAGE_META, ROLE_META } from "../constants";
import type { NoteKind, NoteLanguage, ParsePreview, Participant, ParticipantRole } from "../types";

type PreviewPanelProps = {
  preview: ParsePreview | null;
  error: string | null;
  kind: NoteKind | undefined;
  language: NoteLanguage | undefined;
  participants: Participant[];
  onKind: (kind: NoteKind) => void;
  onLanguage: (language: NoteLanguage) => void;
  onMap: (label: string, patch: Partial<Participant>) => void;
  isAr: boolean;
};

/**
 * How the text will be read before it's saved: notes or a transcript, which
 * language, and who each speaker label is.
 */
export function PreviewPanel({ preview, error, kind, language, participants, onKind, onLanguage, onMap, isAr }: PreviewPanelProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";

  return (
    <aside aria-label={t("How it will be read", "كيف ستُقرأ")} className="mk-surface flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 lg:sticky lg:top-0">
      <div className="flex items-center justify-between gap-space-3">
        <h2 className="text-h5 font-medium">{t("Preview", "المعاينة")}</h2>
        {preview && (
          <span className="text-caption text-text-muted tabular-nums">
            {preview.wordCount.toLocaleString("en")} {t("words", "كلمة")}
          </span>
        )}
      </div>

      {error && <p className="text-caption text-danger">{error}</p>}

      {!preview ? (
        <EmptyHint>{t("Paste notes or a transcript, and how it will be read shows here.", "الصق الملاحظات أو النص المفرّغ، وستظهر هنا طريقة قراءته.")}</EmptyHint>
      ) : (
        <>
          <div className="flex flex-col gap-space-4">
            <SelectField
              label={t("Kind", "النوع")}
              value={kind ?? preview.kind}
              onChange={(e) => onKind(e.target.value as NoteKind)}
              options={(Object.keys(KIND_META) as NoteKind[]).map((k) => ({
                value: k,
                label: `${KIND_META[k][lang]}${k === preview.detectedKind ? t(" (detected)", " (مكتشف)") : ""}`,
              }))}
            />
            <SelectField
              label={t("Language", "اللغة")}
              value={language ?? preview.language}
              onChange={(e) => onLanguage(e.target.value as NoteLanguage)}
              options={(Object.keys(LANGUAGE_META) as NoteLanguage[]).map((l) => ({ value: l, label: LANGUAGE_META[l][lang] }))}
            />
          </div>

          {preview.kind === "transcript" && (
            <section className="flex flex-col gap-space-4">
              <div className="flex items-center justify-between">
                <h3 className="text-caption text-text-muted">{t("Speakers", "المتحدثون")}</h3>
                <Badge>{preview.speakers.length}</Badge>
              </div>
              {preview.speakers.length === 0 ? (
                <EmptyHint>{t("No speaker labels found. Lines like “Omar: …” become speakers.", "لم تُعثر على أسماء متحدثين. الأسطر مثل «عمر: …» تصبح متحدثين.")}</EmptyHint>
              ) : (
                <ul className="flex flex-col gap-space-5">
                  {preview.speakers.map((s) => {
                    const mapped = participants.find((p) => p.label === s.label);
                    return (
                      <li key={s.label} className="flex flex-col gap-space-2">
                        <span className="flex items-center gap-space-3 text-caption text-text-muted">
                          <span className="bidi-plain font-medium text-text-secondary">
                            {s.label}
                          </span>
                          <span>
                            · {s.turns} {t(s.turns === 1 ? "turn" : "turns", "مداخلة")}
                          </span>
                        </span>
                        <div className="grid grid-cols-[minmax(0,1fr)_120px] items-end gap-space-3">
                          <InputField
                            label={t(`Who is ${s.label}`, `من هو ${s.label}`)}
                            value={mapped?.name ?? s.label}
                            dir="auto"
                            onChange={(e) => onMap(s.label, { name: e.target.value })}
                          />
                          <SelectField
                            label={t("Role", "الدور")}
                            value={mapped?.role ?? "client"}
                            onChange={(e) => onMap(s.label, { role: e.target.value as ParticipantRole })}
                            options={(Object.keys(ROLE_META) as ParticipantRole[]).map((r) => ({ value: r, label: ROLE_META[r][lang] }))}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </aside>
  );
}
