import type { Lang } from "@/types";

/** Text a client reads, in both languages; either side is null when the form is in one language only. */
export type LocalizedText = { en: string | null; ar: string | null };

export type QuestionType = "text" | "choice" | "scale" | "ranking" | "image_choice" | "upload" | "link";

export type QuestionCategory = "business" | "audience" | "competitors" | "personality" | "visual" | "naming" | "practical";

export type FormStatus = "draft" | "sent" | "in_progress" | "submitted";

export type Option = { value: string; label: LocalizedText; assetId?: string | null };

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
  templateKey: string;
  name: string;
  languages: Lang[];
  primaryLanguage: Lang;
  status: FormStatus;
  theme: FormTheme;
  settings: FormSettings;
  publicToken: string | null;
  recipientName: string;
  recipientEmail: string;
  sentAt: string | null;
  firstAnswerAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: FormSection[];
};
