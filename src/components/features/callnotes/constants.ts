import type { Confidence, NoteKind, NoteLanguage, NoteTarget, ParticipantRole } from "./types";

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

export const FIELD_META: Record<string, Bilingual> = {
  purpose: { en: "Purpose", ar: "الغاية" },
  mission: { en: "Mission", ar: "الرسالة" },
  vision: { en: "Vision", ar: "الرؤية" },
  targetAudienceSummary: { en: "Target audience", ar: "الجمهور المستهدف" },
  positioningStatement: { en: "Positioning", ar: "التموضع" },
  uvp: { en: "Unique value", ar: "القيمة الفريدة" },
};

export const NOTE_TARGET_META: Record<NoteTarget, Bilingual> = {
  coreValues: { en: "Core values", ar: "القيم الجوهرية" },
  personas: { en: "Personas", ar: "الشخصيات" },
  competitors: { en: "Competitors", ar: "المنافسون" },
  voice: { en: "Tone of voice", ar: "نبرة الصوت" },
  visual: { en: "Visual direction", ar: "الاتجاه البصري" },
  naming: { en: "Naming", ar: "التسمية" },
};

export const CONFIDENCE_META: Record<Confidence, Bilingual & { tone: "success" | "warning" | "neutral" }> = {
  clear: { en: "Clear", ar: "واضح", tone: "success" },
  partial: { en: "Partial", ar: "جزئي", tone: "warning" },
  missing: { en: "Not covered", ar: "غير مغطّى", tone: "neutral" },
};
