import type { AnalysisTarget, ConditionOperator, FormStatus, QuestionCategory, QuestionType } from "./types";

type Bilingual = { en: string; ar: string };

type Tone = "neutral" | "info" | "accent" | "success" | "warning";

export const STATUS_META: Record<FormStatus, Bilingual & { tone: Tone }> = {
  draft: { en: "Draft", ar: "مسودة", tone: "neutral" },
  sent: { en: "Sent", ar: "أُرسل", tone: "info" },
  in_progress: { en: "In progress", ar: "قيد الإجابة", tone: "warning" },
  submitted: { en: "Submitted", ar: "مُسلَّم", tone: "success" },
};

export const STATUS_ORDER: FormStatus[] = ["draft", "sent", "in_progress", "submitted"];

export const CATEGORY_LABELS: Record<QuestionCategory, Bilingual> = {
  business: { en: "Business", ar: "الشركة" },
  audience: { en: "Audience", ar: "الجمهور" },
  competitors: { en: "Competitors", ar: "المنافسون" },
  personality: { en: "Personality", ar: "الشخصية" },
  visual: { en: "Visual", ar: "الهوية البصرية" },
  naming: { en: "Naming", ar: "التسمية" },
  practical: { en: "Practical", ar: "التفاصيل العملية" },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as QuestionCategory[];

/** Each type's name and icon (16px in the builder, from tailwind/icons.js). */
export const TYPE_META: Record<QuestionType, Bilingual & { icon: string }> = {
  text: { en: "Text", ar: "نص", icon: "font" },
  choice: { en: "Choice", ar: "اختيار", icon: "list-ul" },
  scale: { en: "Scale", ar: "مقياس", icon: "sliders" },
  ranking: { en: "Ranking", ar: "ترتيب", icon: "arrows-v" },
  image_choice: { en: "Image choice", ar: "اختيار بالصور", icon: "image" },
  upload: { en: "File upload", ar: "رفع ملفات", icon: "upload" },
  link: { en: "Links", ar: "روابط", icon: "link" },
};

export const TYPE_ORDER = Object.keys(TYPE_META) as QuestionType[];

/** What an answer feeds: a Strategy Hub field, or an area the AI analysis reads. */
export const ANALYSIS_TARGETS: Record<AnalysisTarget, Bilingual> = {
  purpose: { en: "Purpose", ar: "الغاية" },
  mission: { en: "Mission", ar: "الرسالة" },
  vision: { en: "Vision", ar: "الرؤية" },
  targetAudienceSummary: { en: "Target audience", ar: "الجمهور المستهدف" },
  positioningStatement: { en: "Positioning", ar: "التموضع" },
  uvp: { en: "Unique value", ar: "القيمة الفريدة" },
  coreValues: { en: "Core values", ar: "القيم الجوهرية" },
  personas: { en: "Personas", ar: "الشخصيات" },
  competitors: { en: "Competitors", ar: "المنافسون" },
  voice: { en: "Tone of voice", ar: "نبرة الصوت" },
  visual: { en: "Visual direction", ar: "الاتجاه البصري" },
  naming: { en: "Naming", ar: "التسمية" },
};

export const OPERATOR_LABELS: Record<ConditionOperator, Bilingual> = {
  equals: { en: "is", ar: "يساوي" },
  not_equals: { en: "is not", ar: "لا يساوي" },
  includes: { en: "includes", ar: "يتضمن" },
  gte: { en: "is at least", ar: "على الأقل" },
  lte: { en: "is at most", ar: "على الأكثر" },
};

/** Which operators make sense for a question of each type. */
export const OPERATORS_FOR: Record<QuestionType, ConditionOperator[]> = {
  text: ["equals", "not_equals", "includes"],
  choice: ["equals", "not_equals", "includes"],
  scale: ["equals", "gte", "lte"],
  ranking: [],
  image_choice: ["includes"],
  upload: [],
  link: [],
};

export const LANGUAGE_LABELS = { en: { en: "English", ar: "الإنجليزية" }, ar: { en: "Arabic", ar: "العربية" } } as const;

/** The top bar's name for each discovery page. */
export const PAGE_SECTIONS = {
  forms: { en: "Discovery forms", ar: "نماذج الاستكشاف" },
  newForm: { en: "New form", ar: "نموذج جديد" },
} as const;

/** The brand's logo slots, as the form's theme offers them. */
export const LOGO_LABELS = {
  latin: { en: "Latin logo", ar: "الشعار اللاتيني" },
  arabic: { en: "Arabic logo", ar: "الشعار العربي" },
  symbol: { en: "Symbol", ar: "الرمز" },
} as const;
