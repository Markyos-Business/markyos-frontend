"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, EmptyState, Icon, Skeleton, Switch, useDialog, useToast } from "@/components/ui";
import { SearchField } from "@/components/form";
import { useCitationJump } from "@/hooks/useCitationJump";
import { formatDay } from "@/components/features/discovery";
import { KIND_META, LANGUAGE_META, ROLE_META } from "../constants";
import { useCallNote } from "../hooks/useCallNote";
import { deleteNote, restoreNote, setIncluded } from "../services/callNotesService";
import type { CallNote } from "../types";
import { callDay, formatMinutes, initials } from "../utils/format";
import { NoteParagraphs, OriginalText, TurnList } from "./NoteBody";

type CallNoteDetailProps = {
  noteId: string;
  editHref: string;
  backHref: string;
  isAr: boolean;
};

/** One call note: who was there, whether the analysis reads it, and what was said. */
export function CallNoteDetail({ noteId, editHref, backHref, isAr }: CallNoteDetailProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";
  const router = useRouter();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const { data, error, loading } = useCallNote(noteId);
  const [note, setNote] = useState<CallNote | null>(null);
  const [query, setQuery] = useState("");
  const [original, setOriginal] = useState(false);
  const current = note ?? data;
  useCitationJump(!!current, (params) => {
    const turn = params.get("turn");
    const para = params.get("para");
    return turn != null ? `turn-${turn}` : para != null ? `para-${para}` : null;
  });

  if (error && !current) return <EmptyState icon="exclamation-circle" title={t("Couldn't open these notes", "تعذّر فتح الملاحظات")} description={error} />;
  if (loading && !current) return <Skeleton className="h-96 w-full rounded-card" />;
  if (!current) return null;

  const canEdit = current.canEdit !== false;
  const matches = query.trim() ? current.body.toLowerCase().split(query.trim().toLowerCase()).length - 1 : 0;

  const toggle = async () => {
    try {
      setNote(await setIncluded(current.id, !current.includeInAnalysis));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That didn't change.", "لم يتغيّر ذلك."), "danger");
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: t("Delete these call notes?", "حذف ملاحظات المكالمة؟"),
      body: t("They move to the trash and drop out of future analyses.", "تنتقل إلى المهملات وتخرج من التحليلات القادمة."),
      consequences: current.citedInAnalysis
        ? [t("The last analysis cites these notes. Its citations to them will no longer open.", "يستشهد آخر تحليل بهذه الملاحظات، ولن تفتح استشهاداته بها بعد الآن.")]
        : undefined,
      confirmLabel: t("Delete", "حذف"),
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    const here = window.location.pathname;
    try {
      await deleteNote(current.id);
      showToast(t("Moved to the trash", "نُقلت إلى المهملات"), "success", {
        label: t("Undo", "تراجع"),
        run: () => void restoreNote(current.id).then(() => router.push(here)),
      });
      router.push(backHref);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That didn't delete.", "لم يُحذف ذلك."), "danger");
    }
  };

  const transcript = current.kind === "transcript" && current.turns.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start gap-space-5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-space-3">
          <h1 className="bidi-plain text-h3 font-medium">
            {current.title}
          </h1>
          <div className="flex flex-wrap items-center gap-space-4 text-caption text-text-muted">
            <span>{formatDay(callDay(current.callDate), isAr)}</span>
            {formatMinutes(current.durationMinutes, isAr) && <span>· {formatMinutes(current.durationMinutes, isAr)}</span>}
            <Badge>{KIND_META[current.kind][lang]}</Badge>
            <Badge>{LANGUAGE_META[current.language][lang]}</Badge>
            <span className="tabular-nums">
              {current.wordCount.toLocaleString("en")} {t("words", "كلمة")}
            </span>
            {current.discoveryFormName && (
              <span className="bidi-plain">
                · {t("Form", "النموذج")}: {current.discoveryFormName}
              </span>
            )}
          </div>
          {current.participants.length > 0 && (
            <ul className="flex flex-wrap items-center gap-space-4" aria-label={t("Participants", "المشاركون")}>
              {current.participants.map((p, i) => (
                <li key={i} className="flex items-center gap-space-3 text-caption text-text-secondary">
                  <Avatar initials={initials(p.name)} size={24} tone={p.role === "client" ? "accent" : "muted"} />
                  <span className="bidi-plain">{p.name}</span>
                  <span className="text-text-muted">· {ROLE_META[p.role][lang]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-space-4">
          <label className="flex items-center gap-space-3 text-body text-text-secondary">
            {t("Included in analysis", "مُضمَّنة في التحليل")}
            <Switch label={t("Included in analysis", "مُضمَّنة في التحليل")} checked={current.includeInAnalysis} onToggle={() => canEdit && void toggle()} />
          </label>
          {canEdit && (
            <>
              <Button variant="outline" size="sm" href={editHref} icon={<Icon name="pen" size={16} />}>
                {t("Edit", "تعديل")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void remove()} icon={<Icon name="trash" size={16} />}>
                {t("Delete", "حذف")}
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="mk-surface flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 sm:p-space-10">
        <div className="flex flex-wrap items-center justify-between gap-space-5">
          <SearchField
            label={t("Search in these notes", "ابحث في هذه الملاحظات")}
            placeholder={t("Search…", "ابحث…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-space-5">
            {query.trim() && (
              <span role="status" className="text-caption text-text-muted tabular-nums">
                {matches} {t(matches === 1 ? "match" : "matches", "نتيجة")}
              </span>
            )}
            {transcript && (
              <label className="flex items-center gap-space-3 text-caption text-text-muted">
                {t("Show original text", "عرض النص الأصلي")}
                <Switch label={t("Show original text", "عرض النص الأصلي")} checked={original} onToggle={() => setOriginal((o) => !o)} />
              </label>
            )}
          </div>
        </div>
        {original || !transcript ? (
          original ? (
            <OriginalText body={current.body} query={query} isAr={isAr} />
          ) : (
            <NoteParagraphs body={current.body} query={query} isAr={isAr} />
          )
        ) : (
          <TurnList turns={current.turns} participants={current.participants} query={query} isAr={isAr} />
        )}
      </section>
    </div>
  );
}
