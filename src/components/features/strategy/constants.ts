export type StrategyTab =
  | "purpose"
  | "vision-mission"
  | "objectives"
  | "core-values"
  | "audience"
  | "competitive"
  | "positioning-options"
  | "positioning"
  | "uvp"
  | "tone";
export type StrategyMode = "edit" | "read";

export const PAGE_SECTION = { en: "Strategy", ar: "الاستراتيجية" } as const;

export const STRATEGY_TABS: { key: StrategyTab; label: string; arLabel: string }[] = [
  { key: "purpose", label: "Purpose", arLabel: "الغاية" },
  { key: "vision-mission", label: "Vision & mission", arLabel: "الرؤية والرسالة" },
  { key: "objectives", label: "Objectives", arLabel: "الأهداف" },
  { key: "core-values", label: "Core values", arLabel: "القيم الجوهرية" },
  { key: "audience", label: "Target audience & personas", arLabel: "الجمهور المستهدف" },
  { key: "competitive", label: "Competitive analysis", arLabel: "تحليل المنافسين" },
  { key: "positioning-options", label: "Positioning options", arLabel: "خيارات التموضع" },
  { key: "positioning", label: "Brand positioning", arLabel: "تموضع العلامة" },
  { key: "uvp", label: "Unique value proposition", arLabel: "عرض القيمة الفريد" },
  { key: "tone", label: "Personality & tone", arLabel: "الشخصية والنبرة" },
];

/** The three tabs that are one written field each. */
export const SINGLE_TEXT_TABS = {
  purpose: {
    field: "purpose",
    icon: "bullseye",
    title: "Purpose",
    arTitle: "الغاية",
    hint: "Why this brand exists — the layer above the logo files.",
    arHint: "لماذا توجد هذه العلامة — الطبقة التي تعلو ملفات الشعار.",
    placeholder: "Why does this brand exist? One sentence.",
    arPlaceholder: "لماذا توجد هذه العلامة؟ جملة واحدة.",
    multiline: false,
  },
  positioning: {
    field: "positioningStatement",
    icon: "bullseye",
    title: "Brand positioning",
    arTitle: "تموضع العلامة",
    hint: "For [audience], [brand] is the [category] that [benefit] because [reason to believe].",
    arHint: "لـ[الجمهور]، [العلامة] هي [الفئة] التي [الفائدة] لأن [سبب التصديق].",
    placeholder: "Write the positioning statement.",
    arPlaceholder: "اكتب جملة التموضع.",
  },
  uvp: {
    field: "uvp",
    icon: "bullseye",
    title: "Unique value proposition",
    arTitle: "عرض القيمة الفريد",
    hint: "The one thing this brand delivers that a competitor genuinely can't.",
    arHint: "الشيء الوحيد الذي تقدمه هذه العلامة ولا يستطيع أي منافس تقديمه فعلًا.",
    placeholder: "What makes this brand the only real option?",
    arPlaceholder: "ما الذي يجعل هذه العلامة الخيار الحقيقي الوحيد؟",
  },
} as const;

/** Objectives' priority, highest first, with a word in each language. */
export const PRIORITIES = [
  { value: "high", label: "High priority", arLabel: "أولوية عالية", tone: "danger" },
  { value: "medium", label: "Medium priority", arLabel: "أولوية متوسطة", tone: "warning" },
  { value: "low", label: "Low priority", arLabel: "أولوية منخفضة", tone: "neutral" },
] as const;

export const OBJECTIVE_KINDS = [
  { value: "business", label: "Business goals", arLabel: "أهداف العمل" },
  { value: "brand", label: "Brand goals", arLabel: "أهداف العلامة" },
] as const;
