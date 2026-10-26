import type { ConstraintCategory, Level, SectionKey, SourceWarning, StageKey } from "./types";

type Bilingual = { en: string; ar: string };

export const SECTION_ORDER: SectionKey[] = ["snapshot", "goals", "audience", "market", "personality", "tensions", "gaps", "routes", "creative", "constraints"];

export const SECTION_META: Record<SectionKey, Bilingual & { icon: string; hint: Bilingual }> = {
  snapshot: { en: "Snapshot", ar: "لمحة", icon: "file-alt", hint: { en: "The client, offer, market and scope.", ar: "العميل والعرض والسوق والنطاق." } },
  goals: { en: "Goals", ar: "الأهداف", icon: "bullseye", hint: { en: "Business and brand goals, by priority.", ar: "أهداف العمل والعلامة حسب الأولوية." } },
  audience: { en: "Audience", ar: "الجمهور", icon: "users", hint: { en: "Segments and persona sketches.", ar: "الشرائح وملامح الشخصيات." } },
  market: { en: "Market", ar: "السوق", icon: "chart-line", hint: { en: "Competitors and the white space.", ar: "المنافسون والمساحة الفارغة." } },
  personality: { en: "Personality", ar: "الشخصية", icon: "sliders", hint: { en: "Traits, tone and words.", ar: "السمات والنبرة والكلمات." } },
  tensions: { en: "Tensions", ar: "التناقضات", icon: "exclamation-circle", hint: { en: "Where the client contradicts itself.", ar: "حيث يناقض العميل نفسه." } },
  gaps: { en: "Gaps", ar: "الفجوات", icon: "question-circle", hint: { en: "What to ask the client next.", ar: "ما يجب سؤال العميل عنه." } },
  routes: { en: "Routes", ar: "المسارات", icon: "layer-group", hint: { en: "Strategic routes, side by side.", ar: "مسارات استراتيجية متقابلة." } },
  creative: { en: "Creative", ar: "الإبداع", icon: "palette", hint: { en: "Starting points for each route.", ar: "نقاط انطلاق لكل مسار." } },
  constraints: { en: "Constraints", ar: "القيود", icon: "shield-alt", hint: { en: "Risks and how to handle them.", ar: "المخاطر وكيفية التعامل معها." } },
};

export const STAGE_META: Record<StageKey, Bilingual> = {
  extraction: { en: "Reading the answers and calls", ar: "قراءة الإجابات والمكالمات" },
  tensions_gaps: { en: "Finding tensions and gaps", ar: "البحث عن التناقضات والفجوات" },
  routes_creative: { en: "Drafting routes", ar: "صياغة المسارات" },
  constraints: { en: "Checking constraints and risks", ar: "فحص القيود والمخاطر" },
  snapshot: { en: "Writing the snapshot", ar: "كتابة اللمحة" },
};

export const LEVEL_META: Record<Level, Bilingual & { tone: "danger" | "warning" | "neutral" }> = {
  high: { en: "High", ar: "مرتفع", tone: "danger" },
  medium: { en: "Medium", ar: "متوسط", tone: "warning" },
  low: { en: "Low", ar: "منخفض", tone: "neutral" },
};

export const PRIORITY_META: Record<Level, Bilingual> = {
  high: { en: "High priority", ar: "أولوية عالية" },
  medium: { en: "Medium priority", ar: "أولوية متوسطة" },
  low: { en: "Low priority", ar: "أولوية منخفضة" },
};

export const CONSTRAINT_META: Record<ConstraintCategory, Bilingual> = {
  legal: { en: "Legal", ar: "قانوني" },
  cultural: { en: "Cultural", ar: "ثقافي" },
  religious: { en: "Religious", ar: "ديني" },
  regional: { en: "Regional", ar: "إقليمي" },
  budget: { en: "Budget", ar: "الميزانية" },
  timing: { en: "Timing", ar: "التوقيت" },
  technical: { en: "Technical", ar: "تقني" },
  script: { en: "Arabic and Latin script", ar: "الخط العربي واللاتيني" },
};

export const WARNING_META: Record<SourceWarning, Bilingual> = {
  no_submitted_form: { en: "No discovery form has been submitted yet.", ar: "لم يُرسَل أي نموذج استكشاف بعد." },
  form_not_submitted: { en: "A sent form is still waiting for the client.", ar: "نموذج مُرسل ما زال بانتظار العميل." },
  no_call_notes: { en: "There are no call notes in the analysis.", ar: "لا توجد ملاحظات مكالمات في التحليل." },
  few_answers: { en: "Fewer than 10 answers: the read will be thin.", ar: "أقل من 10 إجابات: ستكون القراءة محدودة." },
};

export const CHANNEL_META: Record<"form" | "call", Bilingual> = {
  form: { en: "Ask in a form", ar: "اسأل في نموذج" },
  call: { en: "Ask on a call", ar: "اسأل في مكالمة" },
};

/** The top bar's name for the Analysis tab. */
export const PAGE_SECTION = { en: "Analysis", ar: "التحليل" } as const;
