import { BriefQuestion, BriefTemplateKind } from "@/types";

/**
 * The curated discovery question library.
 *
 * The same pattern as the Section Library: Markyos ships a considered set, and
 * a studio picks from it and adjusts rather than starting at a blank form. This
 * is deliberately not a form builder — Typeform and Tally already exist, and a
 * studio choosing its own question wording is not the thing that makes a brand
 * brief good.
 *
 * Two things make these questions worth more than a generic questionnaire:
 *
 *   * They are written in both languages as *originals*, not translations. The
 *     Arabic asks what an Arabic speaker would be asked, which is the whole
 *     reason a bilingual studio would use this instead of a Google Form.
 *
 *   * Most map to a Strategy Hub field. An answer does not sit in a form
 *     somewhere; it becomes a pending draft against the field it informs, so
 *     the brief feeds the strategy instead of being re-typed into it.
 *
 * Questions that map to no field are still worth asking — budget, timeline and
 * stakeholders shape the work without belonging in the brand's strategy.
 */

export const BRIEF_QUESTIONS: BriefQuestion[] = [
  // ---- The business ----
  {
    key: "what-you-do",
    category: "The business",
    type: "long",
    promptEn: "In one or two sentences, what does your company actually do?",
    promptAr: "في جملة أو جملتين، ما الذي تقوم به شركتكم فعليًا؟",
    helpEn: "Plainly, as you'd say it to someone at a dinner party — not the website version.",
    helpAr: "بكل بساطة، كما تشرحها لشخص في جلسة عادية — لا نسخة الموقع الإلكتروني.",
  },
  {
    key: "why-exists",
    category: "The business",
    type: "long",
    strategyField: "purpose",
    promptEn: "Why does the company exist, beyond making money?",
    promptAr: "لماذا وُجدت الشركة، بعيدًا عن تحقيق الأرباح؟",
    helpEn: "If it closed tomorrow, what would be missing that nobody else provides?",
    helpAr: "لو أُغلقت غدًا، ما الذي سيُفقد ولا يوفره أحد غيركم؟",
  },
  {
    key: "where-going",
    category: "The business",
    type: "long",
    strategyField: "vision",
    promptEn: "Where do you want the company to be in five years?",
    promptAr: "أين تريدون أن تكون الشركة بعد خمس سنوات؟",
    helpEn: "Ambitious is fine. Vague is not — name something you'd be able to tell you'd reached.",
    helpAr: "الطموح جيد، أما الغموض فلا — اذكروا شيئًا يمكنكم معرفة أنكم بلغتموه.",
  },
  {
    key: "how-get-there",
    category: "The business",
    type: "long",
    strategyField: "mission",
    promptEn: "What will you do, day to day, to get there?",
    promptAr: "ما الذي ستفعلونه يوميًا للوصول إلى هناك؟",
  },

  // ---- Audience ----
  {
    key: "who-for",
    category: "Audience",
    type: "long",
    strategyField: "targetAudienceSummary",
    promptEn: "Who is this for? Describe the person, not the demographic.",
    promptAr: "لمن هذا المنتج أو الخدمة؟ صِفوا الشخص نفسه، لا الفئة الديموغرافية.",
    helpEn: "\"Marketing leads at regional F&B brands\" beats \"25–45, urban, middle income\".",
    helpAr: "«مدير تسويق في علامة أغذية إقليمية» أفضل من «٢٥–٤٥، حضري، دخل متوسط».",
  },
  {
    key: "audience-language",
    category: "Audience",
    type: "choice",
    promptEn: "Which language does your audience mostly live in?",
    promptAr: "ما اللغة التي يتعامل بها جمهوركم غالبًا؟",
    choices: [
      { value: "arabic-first", labelEn: "Arabic first", labelAr: "العربية أولًا" },
      { value: "english-first", labelEn: "English first", labelAr: "الإنجليزية أولًا" },
      { value: "both-equally", labelEn: "Both, equally", labelAr: "كلتاهما بالتساوي" },
      { value: "depends", labelEn: "Depends on the market", labelAr: "حسب السوق" },
    ],
    helpEn: "This decides which script leads every lockup, not just which gets translated.",
    helpAr: "هذا يحدد أي خط يتصدر كل شعار، لا أيهما يُترجم فقط.",
  },
  {
    key: "what-they-believe",
    category: "Audience",
    type: "long",
    promptEn: "What does your audience currently believe about you — accurate or not?",
    promptAr: "ما الذي يعتقده جمهوركم عنكم حاليًا — سواء كان صحيحًا أم لا؟",
  },

  // ---- Competition ----
  {
    key: "competitors",
    category: "Competition",
    type: "long",
    promptEn: "Name two or three competitors, and what each does well.",
    promptAr: "اذكروا اثنين أو ثلاثة من المنافسين، وما الذي يجيده كل منهم.",
    helpEn: "Being generous about rivals is more useful here than being right about them.",
    helpAr: "الإنصاف تجاه المنافسين هنا أنفع من إصدار الأحكام عليهم.",
  },
  {
    key: "why-you",
    category: "Competition",
    type: "long",
    strategyField: "uvp",
    promptEn: "What do you do better than anyone near you?",
    promptAr: "ما الذي تجيدونه أكثر من أي جهة قريبة منكم؟",
    helpEn: "One thing, specific enough that a competitor would find it hard to claim too.",
    helpAr: "شيء واحد محدد بحيث يصعب على منافس ادعاؤه أيضًا.",
  },
  {
    key: "positioning",
    category: "Competition",
    type: "long",
    strategyField: "positioningStatement",
    promptEn: "Finish this: \"For [who] who need [what], we are the [category] that [difference].\"",
    promptAr: "أكملوا: «لـ[من] الذين يحتاجون [ماذا]، نحن [الفئة] التي [الفارق]».",
  },

  // ---- Personality ----
  {
    key: "three-words",
    category: "Personality",
    type: "text",
    promptEn: "Three words you want people to use about you.",
    promptAr: "ثلاث كلمات تريدون أن يصفكم الناس بها.",
  },
  {
    key: "three-words-not",
    category: "Personality",
    type: "text",
    promptEn: "Three words you'd hate to hear about you.",
    promptAr: "ثلاث كلمات تكرهون سماعها عنكم.",
    helpEn: "Often more useful than the first three — it's where the real boundaries are.",
    helpAr: "غالبًا أنفع من الثلاث الأولى — فهنا تكمن الحدود الحقيقية.",
  },
  {
    key: "formality",
    category: "Personality",
    type: "scale",
    promptEn: "How formal should the brand sound?",
    promptAr: "ما مدى الرسمية التي يجب أن تبدو عليها العلامة؟",
    helpEn: "1 is a message from a friend. 5 is a letter from a bank.",
    helpAr: "١ رسالة من صديق، و٥ خطاب من بنك.",
  },
  {
    key: "brand-admired",
    category: "Personality",
    type: "long",
    promptEn: "A brand you admire — and specifically what about it.",
    promptAr: "علامة تجارية تُعجبون بها — وما الذي يعجبكم فيها تحديدًا.",
    helpEn: "It doesn't need to be in your industry. \"The way they write\" is a real answer.",
    helpAr: "لا يشترط أن تكون في مجالكم. «طريقة كتابتهم» إجابة كافية.",
  },

  // ---- Practical ----
  {
    key: "existing-assets",
    category: "Practical",
    type: "long",
    promptEn: "What exists already — logo, colours, fonts, a website?",
    promptAr: "ما الموجود لديكم بالفعل — شعار، ألوان، خطوط، موقع إلكتروني؟",
    helpEn: "Include anything you're keeping, and anything you'd be glad to lose.",
    helpAr: "اذكروا ما تنوون الإبقاء عليه وما يسعدكم التخلص منه.",
  },
  {
    key: "non-negotiables",
    category: "Practical",
    type: "long",
    promptEn: "Anything that cannot change?",
    promptAr: "هل هناك ما لا يمكن تغييره؟",
    helpEn: "A registered mark, a legal name, a colour the founder will not part with.",
    helpAr: "علامة مسجّلة، اسم قانوني، أو لون لن يتنازل عنه المؤسس.",
  },
  {
    key: "where-used",
    category: "Practical",
    type: "long",
    promptEn: "Where will this brand actually appear?",
    promptAr: "أين ستظهر هذه العلامة فعليًا؟",
    helpEn: "Packaging, signage, an app, invoices — the list decides what we have to design.",
    helpAr: "تغليف، لافتات، تطبيق، فواتير — القائمة تحدد ما يجب تصميمه.",
  },
  {
    key: "deadline",
    category: "Practical",
    type: "text",
    promptEn: "Is there a date this has to be ready for?",
    promptAr: "هل هناك موعد يجب أن يكون جاهزًا فيه؟",
  },
  {
    key: "who-decides",
    category: "Practical",
    type: "text",
    promptEn: "Who signs this off?",
    promptAr: "من يعتمد هذا العمل نهائيًا؟",
    helpEn: "Naming them now prevents the reveal meeting where a new opinion appears.",
    helpAr: "تحديدهم الآن يمنع ظهور رأي جديد في اجتماع العرض النهائي.",
  },
];

export const QUESTION_BY_KEY = new Map(BRIEF_QUESTIONS.map((q) => [q.key, q]));

/**
 * The three starting points a studio picks between.
 *
 * A rebrand does not need "what do you do" answered from scratch, and a
 * sub-brand's positioning is mostly inherited — so the templates differ by
 * which questions they start with, not just by name.
 */
export const BRIEF_TEMPLATES: Record<
  BriefTemplateKind,
  { label: string; arLabel: string; description: string; questions: string[] }
> = {
  "new-brand": {
    label: "New brand",
    arLabel: "علامة جديدة",
    description: "Nothing exists yet. Asks everything.",
    questions: BRIEF_QUESTIONS.map((q) => q.key),
  },
  rebrand: {
    label: "Rebrand",
    arLabel: "إعادة بناء",
    description: "A brand exists and is being rebuilt. Leans on what's already there.",
    questions: [
      "what-you-do",
      "why-exists",
      "where-going",
      "what-they-believe",
      "who-for",
      "audience-language",
      "competitors",
      "why-you",
      "positioning",
      "three-words",
      "three-words-not",
      "brand-admired",
      "existing-assets",
      "non-negotiables",
      "where-used",
      "deadline",
      "who-decides",
    ],
  },
  "sub-brand": {
    label: "Sub-brand",
    arLabel: "علامة فرعية",
    description: "Sits under a parent brand. Skips what the parent already answers.",
    questions: [
      "what-you-do",
      "who-for",
      "audience-language",
      "why-you",
      "positioning",
      "three-words",
      "formality",
      "existing-assets",
      "non-negotiables",
      "where-used",
      "deadline",
      "who-decides",
    ],
  },
};
