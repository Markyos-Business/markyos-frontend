import type { Lang } from "@/types";

/** Text a client reads, in both languages; either side is null when the form is in one language only. */
export type LocalizedText = { en: string | null; ar: string | null };

export type QuestionType = "text" | "choice" | "scale" | "ranking" | "image_choice" | "upload" | "link";

export type QuestionCategory = "business" | "audience" | "competitors" | "personality" | "visual" | "naming" | "practical";

export type FormStatus = "draft" | "sent" | "in_progress" | "submitted";

/** `imageUrl` is filled in by the public form endpoint from the option's asset. */
export type Option = { value: string; label: LocalizedText; assetId?: string | null; imageUrl?: string | null };

/** Every type's config, flattened; each type reads only its own keys (model/questionTypes.ts). */
export type QuestionConfig = {
  // text
  multiline?: boolean;
  maxLength?: number;
  // choice, image_choice
  options?: Option[];
  multiple?: boolean;
  allowOther?: boolean;
  minPicks?: number;
  maxPicks?: number;
  // scale
  min?: number;
  max?: number;
  minLabel?: LocalizedText;
  maxLabel?: LocalizedText;
  // ranking
  items?: Option[];
  // upload
  accept?: string[];
  maxSizeMb?: number;
  maxFiles?: number;
  // link
  maxCount?: number;
};

export type ChoiceAnswer = { selected: string[]; other: string | null };

/** An answer's value, by question type: text string, scale number, choice object, or a list. */
export type AnswerValue = string | number | ChoiceAnswer | string[] | null;

export type ConditionOperator = "equals" | "not_equals" | "includes" | "gte" | "lte";

export type Condition = { questionId: string; operator: ConditionOperator; value: string | number };

export type Visibility = { match: "all" | "any"; conditions: Condition[] } | null;

export type AnalysisTarget =
  | "purpose"
  | "mission"
  | "vision"
  | "targetAudienceSummary"
  | "positioningStatement"
  | "uvp"
  | "coreValues"
  | "personas"
  | "competitors"
  | "voice"
  | "visual"
  | "naming";

export type LibraryQuestion = {
  id: string;
  category: QuestionCategory;
  type: QuestionType;
  title: LocalizedText;
  help: LocalizedText;
  config: QuestionConfig;
  tags: string[];
  analysisTarget: AnalysisTarget | "";
};

export type FormTemplate = {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  estimatedMinutes: number;
  sections: { title: LocalizedText; questions: string[] }[];
};

export type FormQuestion = {
  id: string;
  order: number;
  sourceLibraryQuestionId: string | null;
  type: QuestionType;
  title: LocalizedText;
  help: LocalizedText;
  required: boolean;
  config: QuestionConfig;
  visibility: Visibility;
  analysisTarget: AnalysisTarget | "";
};

export type FormSection = { id: string; order: number; title: LocalizedText; questions: FormQuestion[] };

export type FormTheme = {
  logoAssetId: string | null;
  accent: string | null;
  background: "light" | "dark";
  welcome: LocalizedText;
  showMarkyosBadge: boolean;
};

export type FormSettings = {
  closesAt: string | null;
  remindAfterDays: number | null;
  allowSaveAndResume: boolean;
  notifyOnSection: boolean;
};

export type DiscoveryForm = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  templateKey: string;
  name: string;
  languages: Lang[];
  primaryLanguage: Lang;
  status: FormStatus;
  theme: FormTheme;
  settings: FormSettings;
  publicToken: string | null;
  linkRevoked: boolean;
  recipientName: string;
  recipientEmail: string;
  sentAt: string | null;
  firstAnswerAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: FormSection[];
};

/** A row of the forms list. */
export type FormSummary = Omit<DiscoveryForm, "sections"> & { answered: number; total: number; lastActivityAt: string };

export type FormListPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: FormSummary[];
  counts: Record<FormStatus | "all", number>;
};

export type FormListQuery = {
  status?: FormStatus | "";
  brand?: string;
  search?: string;
  ordering?: "updated" | "created" | "name" | "status";
  page?: number;
};

export type LibraryPage = { count: number; next: string | null; previous: string | null; results: LibraryQuestion[] };

export type LibraryQuery = { search?: string; category?: QuestionCategory | ""; type?: QuestionType | ""; page?: number; pageSize?: number };

export type TemplateWithPreview = FormTemplate & {
  questionCount: number;
  sectionPreviews: { title: LocalizedText; count: number; sample: LibraryQuestion | null }[];
};

export type NewForm = { brandId: string; name: string; templateKey: string; languages: Lang[]; primaryLanguage: Lang };

export type FormPatch = Partial<{
  name: string;
  languages: Lang[];
  primaryLanguage: Lang;
  theme: Partial<FormTheme>;
  settings: Partial<FormSettings>;
  recipientName: string;
  recipientEmail: string;
}>;

export type QuestionDraft = Partial<{
  sectionId: string;
  libraryQuestionId: string;
  type: QuestionType;
  title: LocalizedText;
  help: LocalizedText;
  required: boolean;
  config: QuestionConfig;
  visibility: Visibility;
  analysisTarget: AnalysisTarget | "";
}>;

export type FormEventType =
  | "created"
  | "sent"
  | "opened"
  | "first_answer"
  | "section_completed"
  | "submitted"
  | "reminded"
  | "reopened"
  | "analysed";

export type ResponsesView = {
  form: Omit<DiscoveryForm, "sections">;
  response: {
    id: string;
    respondentName: string;
    respondentEmail: string;
    language: Lang;
    startedAt: string;
    submittedAt: string | null;
    lastSavedAt: string | null;
  } | null;
  sections: {
    id: string;
    title: LocalizedText;
    questions: (FormQuestion & {
      visible: boolean;
      answer: { value: AnswerValue; answeredLanguage: Lang; answeredAt: string; answeredBy: string } | null;
    })[];
  }[];
  events: { type: FormEventType; actor: string; at: string; data: Record<string, unknown> }[];
  counters: { answered: number; total: number; timeToSubmitSeconds: number | null; respondents: number; files: number };
  /** The uploaded files answers refer to, by asset id. */
  files: Record<string, UploadedFile>;
};

/** A question as the client's form receives it: published content only. */
export type PublicQuestion = Pick<FormQuestion, "id" | "type" | "title" | "help" | "required" | "config" | "visibility">;

/** What the public form endpoint returns: never internal fields. */
export type PublicForm = {
  name: string;
  studioName: string;
  languages: Lang[];
  primaryLanguage: Lang;
  theme: FormTheme;
  logoUrl: string | null;
  status: FormStatus;
  closesAt: string | null;
  allowSaveAndResume: boolean;
  sections: { id: string; title: LocalizedText; questions: PublicQuestion[] }[];
};

/** A file the client uploaded, as its answer refers to it. */
export type UploadedFile = { assetId: string; name: string; url?: string | null };
