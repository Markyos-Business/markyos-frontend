import type { NoteKind, NoteLanguage, ParticipantRole } from "./types";

type Bilingual = { en: string; ar: string };

export const KIND_META: Record<NoteKind, Bilingual> = {
  notes: { en: "Notes", ar: "ملاحظات" },
  transcript: { en: "Transcript", ar: "نص مفرّغ" },
};

export const LANGUAGE_META: Record<NoteLanguage, Bilingual> = {
  ar: { en: "Arabic", ar: "عربي" },
  en: { en: "English", ar: "إنجليزي" },
  mixed: { en: "Mixed", ar: "مختلط" },
};

export const ROLE_META: Record<ParticipantRole, Bilingual & { dot: string }> = {
  client: { en: "Client", ar: "العميل", dot: "bg-accent" },
  studio: { en: "Studio", ar: "الاستوديو", dot: "bg-text-disabled" },
};

export const UPLOAD_ACCEPT = ".txt,.vtt,.srt,.docx";
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


/** The top bar's name for the discovery pages. */
export const PAGE_SECTION = { en: "Discovery", ar: "الاستكشاف" } as const;
