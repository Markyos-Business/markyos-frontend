"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertBanner, Button, Icon, PageHeader, useDialog, useToast } from "@/components/ui";
import { FileField, InputField, SelectField, TextareaField } from "@/components/form";
import { SaveStatus } from "@/components/features/discovery";
import type { TeamMember } from "@/types";
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT } from "../constants";
import { useBrandForms } from "../hooks/useBrandForms";
import { useNoteDraft } from "../hooks/useNoteDraft";
import { useParsePreview } from "../hooks/useParsePreview";
import { createNote, previewFile } from "../services/callNotesService";
import type { CallNote, Participant } from "../types";
import { ParticipantsEditor, guessRole, mergeParticipants } from "./ParticipantsEditor";
import { PreviewPanel } from "./PreviewPanel";

type CallNoteEditorProps = {
  brandId: string;
  team: TeamMember[];
  /** Editing this note; adding a new one when absent. */
  note?: CallNote;
  noteHref: (id: string) => string;
  backHref: string;
  isAr: boolean;
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mk-surface flex flex-col gap-space-6 rounded-card bg-surface-1 p-space-8 sm:p-space-10">
    <h2 className="text-h5 font-medium">{title}</h2>
    {children}
  </section>
);

/** Adding or editing call notes: the details, who was there, and the text itself. */
export function CallNoteEditor({ brandId, team, note, noteHref, backHref, isAr }: CallNoteEditorProps) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const router = useRouter();
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const forms = useBrandForms(brandId);
  const { draft, change, flush, restored, savedAt, saving, error, conflict, unsaved, discardLocal } = useNoteDraft(brandId, note);
  const { preview, error: previewError } = useParsePreview(draft.body, draft.kind);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Each speaker the parser finds becomes a participant to map, once; ones
  // that disappear from the text go with it.
  const labels = preview?.kind === "transcript" ? preview.speakers.map((s) => s.label) : [];
  const labelKey = labels.join("\u0000");
  useEffect(() => {
    const kept = draft.participants.filter((p) => !p.label || labels.includes(p.label));
    const missing = labels.filter((l) => !kept.some((p) => p.label === l));
    if (!missing.length && kept.length === draft.participants.length) return;
    change({ participants: [...kept, ...missing.map((label) => ({ name: label, role: guessRole(label, team), label }))] });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the speakers change
  }, [labelKey]);

  const mapSpeaker = (label: string, patch: Partial<Participant>) =>
    change({ participants: draft.participants.map((p) => (p.label === label ? { ...p, ...patch } : p)) });

  const upload = async (picked: File) => {
    if (draft.body.trim()) {
      const ok = await confirm({
        title: t("Replace the text?", "استبدال النص؟"),
        body: t("The file's text replaces what's in the box now.", "سيحلّ نص الملف محل ما في المربع الآن."),
        confirmLabel: t("Replace", "استبدال"),
        isAr,
      });
      if (!ok) return;
    }
    setFile(picked);
    setReading(true);
    try {
      const read = await previewFile(picked);
      change({ body: read.body, source: read.source, kind: undefined, language: undefined });
      if (!draft.title.trim()) change({ title: picked.name.replace(/\.[^.]+$/, "") });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That file didn't read.", "تعذّرت قراءة الملف."), "danger");
      setFile(null);
    }
    setReading(false);
  };

  const missing = () => {
    const found: Record<string, string> = {};
    if (!draft.title.trim()) found.title = t("Give the call a title.", "أعطِ المكالمة عنوانًا.");
    if (!draft.callDate) found.callDate = t("When was the call?", "متى كانت المكالمة؟");
    if (!draft.body.trim()) found.body = t("Paste the notes or a transcript, or upload a file.", "الصق الملاحظات أو النص المفرّغ، أو ارفع ملفًا.");
    setFieldErrors(found);
    return Object.keys(found).length > 0;
  };

  const save = async () => {
    if (missing()) return;
    setSubmitting(true);
    try {
      if (note) {
        if (await flush()) router.push(noteHref(note.id));
      } else {
        const created = await createNote(brandId, { ...draft, participants: mergeParticipants(draft.participants) });
        discardLocal();
        showToast(t("Call notes saved", "حُفظت ملاحظات المكالمة"), "success");
        router.push(noteHref(created.id));
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("That didn't save.", "لم يُحفظ ذلك."), "danger");
    }
    setSubmitting(false);
  };

  const cancel = async () => {
    if (!note && draft.body.trim()) {
      const ok = await confirm({
        title: t("Leave without saving?", "المغادرة دون حفظ؟"),
        body: t("Your draft stays in this browser, and comes back next time you add notes.", "تبقى المسودة في هذا المتصفح، وتعود حين تضيف ملاحظات مرة أخرى."),
        confirmLabel: t("Leave", "مغادرة"),
        isAr,
      });
      if (!ok) return;
    }
    router.push(note ? noteHref(note.id) : backHref);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={note ? t("Edit call notes", "تعديل ملاحظات المكالمة") : t("Add call notes", "إضافة ملاحظات مكالمة")}
        description={t(
          "Paste your notes or a transcript. They sit next to the form answers, and the analysis reads both.",
          "الصق ملاحظاتك أو النص المفرّغ. تُحفظ بجانب إجابات النموذج، ويقرأ التحليل كليهما."
        )}
        actions={
          <div className="flex items-center gap-space-4">
            {(savedAt || saving || error) && (
              <SaveStatus saving={saving} savedAt={savedAt} error={error} isAr={isAr} />
            )}
            <Button variant="outline" onClick={() => void cancel()}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={submitting || reading} icon={<Icon name="check" size={18} />}>
              {note ? t("Done", "تم") : t("Save notes", "حفظ الملاحظات")}
            </Button>
          </div>
        }
      />

      {restored && !note && (
        <p role="status" className="rounded-lg bg-info-soft px-space-6 py-space-5 text-body text-info">
          {t("Your unsaved draft is back.", "عادت مسودتك غير المحفوظة.")}
        </p>
      )}
      {conflict && (
        <AlertBanner
          message={t(
            "These notes changed somewhere else. Reload to see the newer copy; your last edits here aren't saved.",
            "تغيّرت هذه الملاحظات في مكان آخر. أعد التحميل لرؤية النسخة الأحدث؛ تعديلاتك الأخيرة هنا لم تُحفظ."
          )}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title={t("The call", "المكالمة")}>
            <InputField
              label={t("Title", "العنوان")}
              required
              dir="auto"
              value={draft.title}
              placeholder={t("Kick-off with Omar…", "مكالمة البداية مع عمر…")}
              error={fieldErrors.title}
              onChange={(e) => change({ title: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-space-5 sm:grid-cols-3">
              <InputField
                label={t("Call date", "تاريخ المكالمة")}
                type="date"
                required
                value={draft.callDate}
                error={fieldErrors.callDate}
                onChange={(e) => change({ callDate: e.target.value })}
              />
              <InputField
                label={t("Duration (minutes)", "المدة (بالدقائق)")}
                type="number"
                min={1}
                max={1440}
                inputMode="numeric"
                value={draft.durationMinutes ?? ""}
                onChange={(e) => change({ durationMinutes: e.target.value ? Number(e.target.value) : null })}
              />
              <SelectField
                label={t("Related form", "النموذج المرتبط")}
                value={draft.discoveryFormId ?? ""}
                onChange={(e) => change({ discoveryFormId: e.target.value || null })}
                options={[{ value: "", label: t("None", "لا شيء") }, ...(forms.data ?? []).map((f) => ({ value: f.id, label: f.name }))]}
              />
            </div>
          </Card>

          <Card title={t("Who was on the call", "من حضر المكالمة")}>
            <ParticipantsEditor participants={draft.participants} onChange={(participants) => change({ participants })} team={team} isAr={isAr} />
          </Card>

          <Card title={t("Notes or transcript", "الملاحظات أو النص المفرّغ")}>
            <TextareaField
              label={t("Paste the text", "الصق النص")}
              dir="auto"
              rows={16}
              value={draft.body}
              error={fieldErrors.body}
              placeholder={t("Omar: We start with cafés in Amman…", "عمر: نبدأ بالمقاهي في عمّان…")}
              hint={t("Formatting is dropped on paste; line breaks and lists stay.", "تُزال التنسيقات عند اللصق، وتبقى الأسطر والقوائم.")}
              onChange={(e) => change({ body: e.target.value, source: draft.source === "pasted" ? "pasted" : draft.source })}
            />
            <FileField
              label={t("Or upload a file", "أو ارفع ملفًا")}
              description={t("Text, subtitles or Word. Timings are dropped; timestamps stay on each turn.", "نص أو ترجمة أو وورد. تُحذف التوقيتات وتبقى الأوقات على كل مداخلة.")}
              file={file}
              onFileChange={(f) => void upload(f)}
              onRemove={() => setFile(null)}
              onError={(message) => showToast(message, "danger")}
              accept={UPLOAD_ACCEPT}
              acceptLabel=".txt, .vtt, .srt, .docx · 2 MB"
              maxBytes={MAX_UPLOAD_BYTES}
              variant="compact"
              uploading={reading}
            />
          </Card>
        </div>

        <PreviewPanel
          preview={preview}
          error={previewError}
          kind={draft.kind}
          language={draft.language}
          participants={draft.participants}
          onKind={(kind) => change({ kind })}
          onLanguage={(language) => change({ language })}
          onMap={mapSpeaker}
          isAr={isAr}
        />
      </div>
      {unsaved && <span className="sr-only">{t("Unsaved changes", "تغييرات غير محفوظة")}</span>}
    </div>
  );
}
