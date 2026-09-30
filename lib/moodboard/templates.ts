import type { MoodItemKind, ZoneKind } from "@/lib/types";

/**
 * A moodboard template is a method, not a layout.
 *
 * Milanote's insight, and the one worth copying: a template is a pre-composed
 * board with typed zones and an instruction card in each one, so the board
 * teaches its own use. An empty canvas asks "what do you want to make?", which
 * is the question the person opened the tool to answer.
 *
 * Markyos goes one step further than Milanote does, because the zones here are
 * *typed*. A palette zone knows its cards are colours, so it can offer to
 * propose them to Visual Identity as a Draft. That is the whole reason these
 * are zones rather than headings someone typed.
 *
 * TODO(copy): the English and Arabic instruction lines below are drafts. They
 * are written to be usable rather than final — Abdullah owns the final wording,
 * and every string here is one edit away from being replaced.
 */

export type ZoneSpec = {
  kind: ZoneKind;
  title: string;
  arTitle: string;
  instructions: string;
  arInstructions: string;
  /** Ghost cards shown while the zone is empty. Never stored as items. */
  placeholders: Array<{ kind: MoodItemKind; size: "s" | "m" | "l"; hint: string; arHint: string }>;
};

export type MoodboardTemplate = {
  key: string;
  title: string;
  arTitle: string;
  description: string;
  arDescription: string;
  icon: string;
  zones: ZoneSpec[];
};

/** Zones every board ends with: somewhere to put what hasn't been placed. */
const UNSORTED: ZoneSpec = {
  kind: "unsorted",
  title: "Unsorted",
  arTitle: "غير مصنّف",
  instructions:
    "Anything you have not placed yet. Drag a card into a zone above when you know where it belongs — there is no hurry.",
  arInstructions:
    "كل ما لم تصنّفه بعد. اسحب أي بطاقة إلى قسم أعلاه عندما تعرف مكانها — لا داعي للعجلة.",
  placeholders: [],
};

const IMAGERY: ZoneSpec = {
  kind: "imagery",
  title: "Imagery",
  arTitle: "الصور",
  instructions:
    "Photographs and illustration that feel like the brand. Aim for a direction, not a shopping list — six images that agree say more than twenty that argue.",
  arInstructions:
    "صور ورسومات تعبّر عن روح الهوية. اهدف إلى اتجاه واضح لا إلى قائمة مشتريات — ست صور متناغمة أبلغ من عشرين متضاربة.",
  placeholders: [
    { kind: "asset", size: "l", hint: "A hero image", arHint: "صورة رئيسية" },
    { kind: "asset", size: "m", hint: "A detail", arHint: "تفصيل" },
    { kind: "asset", size: "m", hint: "A person, or a place", arHint: "شخص أو مكان" },
  ],
};

const PALETTE: ZoneSpec = {
  kind: "palette",
  title: "Palette",
  arTitle: "الألوان",
  instructions:
    "Colours pulled from the images above, or added by hand. When the zone looks right, propose it — the colours land in Drafts for review rather than in the brand.",
  arInstructions:
    "ألوان مستخرجة من الصور أعلاه أو مضافة يدويًا. عندما يعجبك القسم، اقترحه — تذهب الألوان إلى المسودات للمراجعة لا إلى الهوية مباشرة.",
  placeholders: [
    { kind: "swatch", size: "s", hint: "A dominant colour", arHint: "لون أساسي" },
    { kind: "swatch", size: "s", hint: "A support colour", arHint: "لون مساند" },
    { kind: "swatch", size: "s", hint: "An accent", arHint: "لون مميّز" },
  ],
};

const TYPE: ZoneSpec = {
  kind: "type",
  title: "Type",
  arTitle: "الخطوط",
  instructions:
    "Typefaces you are considering, and specimens you like. A bilingual brand needs both scripts to hold up — check the Arabic before you fall in love with the Latin.",
  arInstructions:
    "الخطوط التي تفكر فيها والنماذج التي أعجبتك. الهوية ثنائية اللغة تحتاج إلى نجاح الخطين معًا — جرّب العربي قبل أن تقرّر بناءً على اللاتيني.",
  placeholders: [
    { kind: "font", size: "m", hint: "A display face", arHint: "خط عناوين" },
    { kind: "font", size: "m", hint: "A text face", arHint: "خط نصوص" },
  ],
};

const WORDS: ZoneSpec = {
  kind: "words",
  title: "Words",
  arTitle: "الكلمات",
  instructions:
    "How the brand sounds: adjectives, a sentence it would say, a sentence it never would. These become the Voice matrix later.",
  arInstructions:
    "كيف تبدو الهوية: صفات، وجملة قد تقولها، وجملة لن تقولها أبدًا. هذه تصبح مصفوفة الصوت لاحقًا.",
  placeholders: [
    { kind: "note", size: "m", hint: "Three adjectives", arHint: "ثلاث صفات" },
    { kind: "note", size: "m", hint: "A sentence it would say", arHint: "جملة قد تقولها" },
  ],
};

const REFERENCES: ZoneSpec = {
  kind: "references",
  title: "References",
  arTitle: "مراجع",
  instructions:
    "Other brands, sites and work worth stealing a decision from. Paste a link and the source travels with it — none of this is yours to publish.",
  arInstructions:
    "هويات ومواقع وأعمال أخرى تستحق أن تقتبس منها قرارًا. الصق رابطًا وسيُحفظ المصدر معه — لا شيء من هذا ملك لك لتنشره.",
  placeholders: [{ kind: "link", size: "m", hint: "A link worth keeping", arHint: "رابط يستحق الحفظ" }],
};

const TEXTURE: ZoneSpec = {
  kind: "texture",
  title: "Texture & materials",
  arTitle: "الملمس والخامات",
  instructions:
    "Paper, finish, surface, grain. The part of a brand people touch, which a screen mockup will never tell you about.",
  arInstructions:
    "الورق والتشطيب والسطح والحبيبات. الجزء الذي يلمسه الناس من الهوية، وهو ما لن يخبرك به أي نموذج على الشاشة.",
  placeholders: [{ kind: "asset", size: "m", hint: "A material", arHint: "خامة" }],
};

export const MOODBOARD_TEMPLATES: MoodboardTemplate[] = [
  {
    key: "brand-identity",
    title: "Brand identity",
    arTitle: "هوية علامة",
    description: "A new brand direction, from imagery through to voice.",
    arDescription: "اتجاه جديد لعلامة، من الصور إلى نبرة الصوت.",
    icon: "shapes",
    zones: [IMAGERY, PALETTE, TYPE, TEXTURE, WORDS, REFERENCES, UNSORTED],
  },
  {
    key: "rebrand-direction",
    title: "Rebrand direction",
    arTitle: "اتجاه إعادة تصميم",
    description: "Evolving a brand that already exists: what to keep, what to change.",
    arDescription: "تطوير هوية قائمة: ما يبقى وما يتغيّر.",
    icon: "sync",
    zones: [
      {
        kind: "references",
        title: "Current brand",
        arTitle: "الهوية الحالية",
        instructions:
          "What exists today, pulled in for reference. Look at it honestly before deciding what deserves to survive.",
        arInstructions:
          "ما هو قائم اليوم، للرجوع إليه. انظر إليه بصدق قبل أن تقرّر ما يستحق البقاء.",
        placeholders: [{ kind: "asset", size: "m", hint: "The brand as it stands", arHint: "الهوية كما هي" }],
      },
      {
        kind: "custom",
        title: "Keep",
        arTitle: "نُبقي",
        instructions:
          "The equity worth protecting. A rebrand that throws away what customers already recognise is a new brand wearing an old name.",
        arInstructions:
          "الرصيد الذي يستحق الحماية. إعادة التصميم التي تتخلّص مما يعرفه العملاء هي علامة جديدة تحمل اسمًا قديمًا.",
        placeholders: [{ kind: "note", size: "m", hint: "What must survive", arHint: "ما يجب أن يبقى" }],
      },
      {
        kind: "custom",
        title: "Change",
        arTitle: "نغيّر",
        instructions: "What is holding the brand back, and why. Be specific — “feels dated” is not a brief.",
        arInstructions: "ما الذي يعيق الهوية، ولماذا. كن محدّدًا — «يبدو قديمًا» ليست مهمّة تصميم.",
        placeholders: [{ kind: "note", size: "m", hint: "What is not working", arHint: "ما لا يعمل" }],
      },
      IMAGERY,
      PALETTE,
      WORDS,
      UNSORTED,
    ],
  },
  {
    key: "sub-brand",
    title: "Sub-brand",
    arTitle: "علامة فرعية",
    description: "A brand inside a parent system, which it has to belong to.",
    arDescription: "علامة داخل نظام أم، يجب أن تنتمي إليه.",
    icon: "layer-group",
    zones: [
      {
        kind: "references",
        title: "Parent system",
        arTitle: "النظام الأم",
        instructions:
          "The system this has to live inside. Everything below is a variation on it, not an escape from it.",
        arInstructions: "النظام الذي يجب أن تعيش داخله. كل ما تحته تنويع عليه، لا هروب منه.",
        placeholders: [{ kind: "asset", size: "m", hint: "The parent brand", arHint: "العلامة الأم" }],
      },
      IMAGERY,
      {
        ...PALETTE,
        title: "Palette extension",
        arTitle: "امتداد الألوان",
        instructions:
          "Colours that extend the parent palette rather than replacing it. One or two is usually the whole answer.",
        arInstructions: "ألوان تمتدّ من لوحة العلامة الأم لا تستبدلها. لون أو لونان يكفيان غالبًا.",
      },
      TYPE,
      WORDS,
      UNSORTED,
    ],
  },
  {
    key: "campaign-look",
    title: "Campaign look",
    arTitle: "مظهر حملة",
    description: "A campaign on top of a brand that already has a system.",
    arDescription: "حملة فوق هوية لها نظام قائم.",
    icon: "bullseye",
    zones: [
      IMAGERY,
      {
        kind: "references",
        title: "Motion references",
        arTitle: "مراجع الحركة",
        instructions: "How it moves. Link the films and transitions worth borrowing a rhythm from.",
        arInstructions: "كيف تتحرّك. ضع روابط الأفلام والانتقالات التي تستحق أن تقتبس منها إيقاعًا.",
        placeholders: [{ kind: "link", size: "m", hint: "A film or a transition", arHint: "فيلم أو انتقال" }],
      },
      {
        ...PALETTE,
        title: "Accent palette",
        arTitle: "ألوان الحملة",
        instructions:
          "The colour this campaign adds to the brand, not the colour it replaces. One accent is usually enough.",
        arInstructions: "اللون الذي تضيفه هذه الحملة إلى الهوية، لا الذي يستبدلها. لون مميّز واحد يكفي عادة.",
      },
      {
        ...WORDS,
        title: "Headlines",
        arTitle: "العناوين",
        instructions: "Lines the campaign might run. Write them badly first; the good one is usually next to a bad one.",
        arInstructions: "عبارات قد تستخدمها الحملة. اكتبها بسرعة أولًا؛ الجيدة عادة بجوار سيئة.",
      },
      REFERENCES,
      UNSORTED,
    ],
  },
  {
    key: "digital-product",
    title: "Digital product",
    arTitle: "منتج رقمي",
    description: "A product or interface direction rather than a printed identity.",
    arDescription: "اتجاه منتج أو واجهة بدل هوية مطبوعة.",
    icon: "desktop",
    zones: [
      {
        kind: "references",
        title: "UI references",
        arTitle: "مراجع الواجهة",
        instructions: "Interfaces that solve a problem this one has. Note what you are taking, not just that you like it.",
        arInstructions: "واجهات تحلّ مشكلة يواجهها هذا المنتج. دوّن ما تأخذه منها، لا مجرد إعجابك بها.",
        placeholders: [{ kind: "link", size: "m", hint: "A product worth studying", arHint: "منتج يستحق الدراسة" }],
      },
      {
        kind: "custom",
        title: "Components",
        arTitle: "المكوّنات",
        instructions: "Buttons, cards, fields — the parts that get repeated a thousand times and have to survive it.",
        arInstructions: "الأزرار والبطاقات والحقول — الأجزاء التي تتكرّر ألف مرة ويجب أن تصمد.",
        placeholders: [{ kind: "asset", size: "m", hint: "A component worth copying", arHint: "مكوّن يستحق الاقتباس" }],
      },
      PALETTE,
      TYPE,
      {
        kind: "custom",
        title: "Iconography",
        arTitle: "الأيقونات",
        instructions: "Weight, corner, and whether they are filled or drawn. Pick once; every icon after follows it.",
        arInstructions: "السماكة والزوايا، وهل هي ممتلئة أم مرسومة. اختر مرة واحدة، وكل أيقونة بعدها تتبعها.",
        placeholders: [{ kind: "asset", size: "s", hint: "An icon set", arHint: "مجموعة أيقونات" }],
      },
      WORDS,
      UNSORTED,
    ],
  },
];

export function templateByKey(key: string | undefined): MoodboardTemplate | undefined {
  return MOODBOARD_TEMPLATES.find((t) => t.key === key);
}

/** The instruction copy for a zone, looked up from its board's template. */
export function zoneSpecFor(
  templateKey: string | undefined,
  zoneKind: ZoneKind,
  title: string,
): ZoneSpec | undefined {
  const template = templateByKey(templateKey);
  if (!template) return undefined;
  // Matched on the title as well as the kind, because a template may carry two
  // zones of the same kind with different jobs — "Keep" and "Change" are both
  // custom, and telling someone to list what must survive under the heading
  // asking what is broken would be worse than saying nothing.
  return template.zones.find((z) => z.kind === zoneKind && z.title === title)
    ?? template.zones.find((z) => z.kind === zoneKind);
}
