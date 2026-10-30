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

/** The section editor's label for each field it shows. */
export const FIELD_LABELS: Record<string, Bilingual> = {
  client: { en: "Client", ar: "العميل" },
  offer: { en: "Offer", ar: "العرض" },
  market: { en: "Market", ar: "السوق" },
  projectType: { en: "Project type", ar: "نوع المشروع" },
  scope: { en: "Scope", ar: "النطاق" },
  facts: { en: "Facts", ar: "الحقائق" },
  label: { en: "Label", ar: "العنوان" },
  value: { en: "Value", ar: "القيمة" },
  business: { en: "Business goals", ar: "أهداف العمل" },
  brand: { en: "Brand goals", ar: "أهداف العلامة" },
  text: { en: "Text", ar: "النص" },
  priority: { en: "Priority", ar: "الأولوية" },
  segments: { en: "Segments", ar: "الشرائح" },
  personas: { en: "Personas", ar: "الشخصيات" },
  name: { en: "Name", ar: "الاسم" },
  description: { en: "Description", ar: "الوصف" },
  ageRange: { en: "Age range", ar: "الفئة العمرية" },
  city: { en: "City", ar: "المدينة" },
  job: { en: "Job", ar: "الوظيفة" },
  needs: { en: "Needs", ar: "الاحتياجات" },
  frustrations: { en: "Frustrations", ar: "مصادر الإحباط" },
  quote: { en: "Quote", ar: "اقتباس" },
  howTheyChoose: { en: "How they choose", ar: "كيف يختارون" },
  context: { en: "Context", ar: "السياق" },
  competitors: { en: "Competitors", ar: "المنافسون" },
  positioning: { en: "Positioning", ar: "التموضع" },
  strengths: { en: "Strengths", ar: "نقاط القوة" },
  gaps: { en: "Gaps", ar: "الثغرات" },
  mentionedBy: { en: "Mentioned by", ar: "ذُكر من قِبل" },
  whiteSpace: { en: "White space", ar: "المساحة الفارغة" },
  traits: { en: "Traits", ar: "السمات" },
  trait: { en: "Trait", ar: "السمة" },
  evidence: { en: "Evidence", ar: "الدليل" },
  sliders: { en: "Tone sliders", ar: "مؤشرات النبرة" },
  left: { en: "Left", ar: "الطرف الأيسر" },
  right: { en: "Right", ar: "الطرف الأيمن" },
  wordsToUse: { en: "Words to use", ar: "كلمات تُستخدم" },
  wordsToAvoid: { en: "Words to avoid", ar: "كلمات تُتجنب" },
  items: { en: "Items", ar: "العناصر" },
  statementA: { en: "One thing they said", ar: "ما قالوه أولًا" },
  statementB: { en: "And another", ar: "وما قالوه أيضًا" },
  whyItMatters: { en: "Why it matters", ar: "لماذا يهم" },
  question: { en: "Question", ar: "السؤال" },
  severity: { en: "Severity", ar: "الخطورة" },
  blocks: { en: "Holds up", ar: "يعيق" },
  channel: { en: "Ask in", ar: "يُسأل في" },
  idea: { en: "Idea", ar: "الفكرة" },
  pros: { en: "Pros", ar: "المزايا" },
  risks: { en: "Risks", ar: "المخاطر" },
  fit: { en: "Fit (1–5)", ar: "الملاءمة (1–5)" },
  routes: { en: "Routes", ar: "المسارات" },
  routeName: { en: "Route", ar: "المسار" },
  themes: { en: "Themes", ar: "المحاور" },
  visualCues: { en: "Visual cues", ar: "إشارات بصرية" },
  verbalCues: { en: "Verbal cues", ar: "إشارات لفظية" },
  references: { en: "References", ar: "مراجع" },
  category: { en: "Category", ar: "الفئة" },
  mitigation: { en: "Mitigation", ar: "المعالجة" },
};

/** Fields with a fixed set of values, edited with a select. */
export const FIELD_CHOICES: Record<string, Record<string, Bilingual>> = {
  priority: LEVEL_META,
  severity: LEVEL_META,
  category: CONSTRAINT_META,
  channel: CHANNEL_META,
  mentionedBy: { client: { en: "The client", ar: "العميل" }, asked: { en: "When asked", ar: "عند السؤال" } },
  blocks: Object.fromEntries(
    Object.entries(SECTION_META)
      .filter(([k]) => k !== "tensions" && k !== "gaps")
      .map(([k, v]) => [k, { en: v.en, ar: v.ar }])
  ),
};
