import type { FormStatus } from "@/components/features/discovery";

export type NoteKind = "notes" | "transcript";
export type NoteLanguage = "ar" | "en" | "mixed";
export type ParticipantRole = "client" | "studio";
export type NoteSource = "pasted" | "uploaded_txt" | "uploaded_vtt" | "uploaded_docx" | "other";

/** Someone on the call. `label` is the speaker label they were mapped from. */
export type Participant = { name: string; role: ParticipantRole; label?: string };

/** One speaker turn of a parsed transcript. The raw text is kept beside it. */
export type Turn = { speaker: string | null; timestamp: string | null; text: string };

type NoteBase = {
  id: string;
  workspaceId: string;
  workspaceSlug: string;
  title: string;
  /** `YYYY-MM-DD`, a calendar day with no time zone. */
  callDate: string;
  durationMinutes: number | null;
  kind: NoteKind;
  language: NoteLanguage;
  participants: Participant[];
  source: NoteSource;
  discoveryFormId: string | null;
  discoveryFormName: string | null;
  includeInAnalysis: boolean;
  wordCount: number;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  speakers: number;
};

export type CallNote = NoteBase & {
  body: string;
  turns: Turn[];
  /** Whether the caller may edit; set on a single note's read. */
  canEdit?: boolean;
  /** Whether the brand's latest analysis cites this note. */
  citedInAnalysis?: boolean;
};
export type CallNoteSummary = NoteBase & { excerpt: string };

export type CallNotePage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CallNoteSummary[];
  counts: { all: number; notes: number; transcript: number };
};

export type NoteDraft = {
  title: string;
  callDate: string;
  durationMinutes: number | null;
  kind?: NoteKind;
  language?: NoteLanguage;
  body: string;
  participants: Participant[];
  source: NoteSource;
  discoveryFormId: string | null;
  includeInAnalysis?: boolean;
};

export type ParsePreview = {
  body: string;
  kind: NoteKind;
  detectedKind: NoteKind;
  language: NoteLanguage;
  turns: Turn[];
  speakers: { label: string; turns: number }[];
  wordCount: number;
  source: NoteSource;
};

export type FeedForm = {
  type: "form";
  id: string;
  title: string;
  status: FormStatus;
  recipientName: string;
  answered: number;
  total: number;
  date: string | null;
  at: string | null;
};
export type FeedCall = CallNoteSummary & { type: "call"; date: string; at: string };
export type FeedItem = FeedForm | FeedCall;

export type DiscoveryFeed = {
  brand: { id: string; slug: string; name: string };
  canEdit: boolean;
  items: FeedItem[];
};

/** A form to link a call to: just enough for a picker. */
export type FormOption = { id: string; name: string };

// ---- The brand's analysis ----

export type CitationRef =
  | { type: "form"; formId: string; formName: string; questionId: string; number: number }
  | { type: "call"; noteId: string; title: string; turn?: number; para?: number; speaker?: string; role?: string };

/** Where a claim in the analysis came from: "Form · Q12", "Call · 14 Oct · Omar Aziz". */
export type Citation = { id: string; label: string; ref: CitationRef };

type Cited = { en: string; ar: string; citations: Citation[] };
export type Confidence = "clear" | "partial" | "missing";
export type AnalysisField = Cited & { confidence: Confidence };
export type NoteTarget = "coreValues" | "personas" | "competitors" | "voice" | "visual" | "naming";

export type Analysis = {
  id: string;
  summary: { en: string; ar: string };
  fields: Record<string, AnalysisField>;
  notes: (Cited & { target: NoteTarget })[];
  followUps: Cited[];
  inputs: { forms: number; calls: number; sources: number; cut: { noteId: string; title: string; wordsSent: number; wordsTotal: number }[] };
  drafts: number;
  model: string;
  promptVersion: string;
  at: string;
  by: string;
};

export type AnalysisState = { analysis: Analysis | null; stale: boolean; configured: boolean };
