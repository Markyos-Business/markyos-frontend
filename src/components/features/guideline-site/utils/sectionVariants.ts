/**
 * The layouts each section of the guideline site can be drawn in.
 *
 * The six site templates decide the page: its ground, its navigation, its type
 * scale, how a section is framed and numbered. Until now they also decided the
 * *inside* of every derived section, and there was exactly one of each — one way
 * to show a palette, one way to show a typeface. A studio could move the colour
 * section, hide it, pad it, put it on a brand colour, and could not make it look
 * like anything other than a grid of swatch cards.
 *
 * These are those choices. A palette as swatch cards, as full-width bands, as
 * dense chips, or with the primary given a block of its own are four layouts a
 * real brand manual uses, and none of them is reachable from the other by
 * changing a padding value — they are different components, which is why this is
 * a choice of renderer rather than another style property.
 *
 * Two rules every layout here keeps:
 *
 * 1. **It reads brand data live.** A layout never stores a copy of anything. The
 *    palette section shows `ws.colors` however it is drawn, so adding a colour
 *    updates all four.
 * 2. **It styles itself from `--g-*` tokens and the `surface.ts` helpers**, so it
 *    inherits whichever template is active. A band layout is square and shadowed
 *    under Signal and round and filled under Atlas from the same component, and
 *    `scripts/token-contract.mjs` holds that to account.
 *
 * No React here on purpose: this is the list, and both the renderer and the
 * inspector's picker read it, so the two cannot offer different sets.
 */

export interface SectionVariant {
  key: string;
  label: string;
  arLabel: string;
  /** One line, in the picker, saying what makes this one different. */
  hint: string;
  arHint: string;
}

/**
 * Keyed by section id — the same ids `useGuidelineViewer` puts in the flow.
 *
 * **The first entry of each list is the default**, and it is the layout that
 * section already had. That ordering is load-bearing: `resolveVariantKey` falls
 * back to it, so a workspace that has never chosen anything keeps rendering
 * exactly as it did, and nothing in this file changes an existing guideline until
 * somebody picks something.
 */
export const SECTION_VARIANTS: Record<string, SectionVariant[]> = {
  color: [
    {
      key: "cards",
      label: "Swatch cards",
      arLabel: "بطاقات الألوان",
      hint: "A grid of cards, each opening to its HEX, RGB and CMYK.",
      arHint: "شبكة بطاقات، كل واحدة تُفتح على قيم HEX و RGB و CMYK.",
    },
    {
      key: "bands",
      label: "Full-width bands",
      arLabel: "أشرطة بعرض الصفحة",
      hint: "One deep band per colour, name and value set in the colour's own ink.",
      arHint: "شريط لكل لون، بالاسم والقيمة بحبر اللون نفسه.",
    },
    {
      key: "chips",
      label: "Dense chips",
      arLabel: "مربعات مكثفة",
      hint: "Small squares, many to a row — for a palette with a lot in it.",
      arHint: "مربعات صغيرة، عدد كبير في الصف — للوحة ألوان كبيرة.",
    },
    {
      key: "feature",
      label: "Primary featured",
      arLabel: "إبراز الأساسي",
      hint: "The primary colour gets a block of its own; the rest sit beneath it.",
      arHint: "اللون الأساسي في مساحة خاصة، والبقية تحته.",
    },
  ],
  logo: [
    {
      key: "full",
      label: "Full system",
      arLabel: "النظام الكامل",
      hint: "Every lockup, plus the clearspace drawing and the colour variations.",
      arHint: "كل الصيغ، مع رسم المساحة الآمنة وتنويعات الألوان.",
    },
    {
      key: "lockups",
      label: "Lockups only",
      arLabel: "الصيغ فقط",
      hint: "The marks on their own, drawn larger. No construction drawings.",
      arHint: "الشعارات وحدها بحجم أكبر، بدون رسوم الإنشاء.",
    },
    {
      key: "hero",
      label: "Primary showcase",
      arLabel: "عرض الشعار الأساسي",
      hint: "The primary lockup across the full width, the others in a row below.",
      arHint: "الشعار الأساسي بعرض الصفحة، والبقية في صف تحته.",
    },
  ],
  typography: [
    {
      key: "specimen",
      label: "Specimen",
      arLabel: "عيّنة",
      hint: "Character set, a real sentence, and the brand's own size scale.",
      arHint: "مجموعة الحروف، جملة حقيقية، ومقاسات الهوية.",
    },
    {
      key: "scale",
      label: "Size table",
      arLabel: "جدول المقاسات",
      hint: "Every step as a row: size, line height, and the face set at it.",
      arHint: "كل مقاس في صف: الحجم، ارتفاع السطر، والخط به.",
    },
    {
      key: "poster",
      label: "Poster",
      arLabel: "ملصق",
      hint: "One large letterform per family, named, with a single line set under it.",
      arHint: "حرف كبير لكل خط، باسمه، وسطر واحد تحته.",
    },
  ],
  photography: [
    {
      key: "grid",
      label: "Even grid",
      arLabel: "شبكة متساوية",
      hint: "Equal tiles, three to a row.",
      arHint: "مربعات متساوية، ثلاثة في الصف.",
    },
    {
      key: "feature",
      label: "Lead image",
      arLabel: "صورة رئيسية",
      hint: "The first photograph runs wide, the rest fill a grid beneath it.",
      arHint: "الصورة الأولى بعرض كامل، والبقية في شبكة تحتها.",
    },
    {
      key: "strip",
      label: "Full-width rows",
      arLabel: "صفوف بعرض الصفحة",
      hint: "One photograph per row, edge to edge.",
      arHint: "صورة واحدة في كل صف، من الحافة إلى الحافة.",
    },
  ],
  icons: [
    {
      key: "grid",
      label: "Tiles",
      arLabel: "مربعات",
      hint: "Even tiles, the icon centred in each.",
      arHint: "مربعات متساوية، الأيقونة في وسط كل منها.",
    },
    {
      key: "named",
      label: "Named tiles",
      arLabel: "مربعات بالأسماء",
      hint: "Each tile captioned with the file name, so a developer can ask for one.",
      arHint: "كل مربع باسم الملف، ليطلبه المطوّر بالاسم.",
    },
    {
      key: "dense",
      label: "Dense set",
      arLabel: "مجموعة مكثفة",
      hint: "Smaller tiles, many to a row — for a set of twenty or more.",
      arHint: "مربعات أصغر، عدد كبير في الصف — لمجموعة من عشرين أو أكثر.",
    },
  ],
  mockups: [
    {
      key: "two-up",
      label: "Two up",
      arLabel: "اثنان في الصف",
      hint: "Two per row, captioned.",
      arHint: "اثنان في كل صف، مع التسمية.",
    },
    {
      key: "one-up",
      label: "One up",
      arLabel: "واحد في الصف",
      hint: "One per row, large — for mockups worth looking at closely.",
      arHint: "واحد في كل صف، كبير — للتطبيقات التي تستحق النظر عن قرب.",
    },
    {
      key: "three-up",
      label: "Three up",
      arLabel: "ثلاثة في الصف",
      hint: "Three per row, smaller — for a long set of applications.",
      arHint: "ثلاثة في كل صف، أصغر — لمجموعة طويلة من التطبيقات.",
    },
  ],
};

/** The layouts offered for a section, or none if it has only one. */
export function variantsFor(sectionId: string): SectionVariant[] {
  return SECTION_VARIANTS[sectionId] ?? [];
}

/** Whether this section is one the studio can choose a layout for. */
export function hasVariants(sectionId: string): boolean {
  return variantsFor(sectionId).length > 1;
}

/**
 * The layout key actually in force.
 *
 * Falls back to the default both when nothing was chosen and when what was
 * chosen no longer exists. The second case is the one worth having: a guideline
 * published a year ago naming a layout since renamed must keep rendering its
 * palette, not a blank section.
 */
export function resolveVariantKey(sectionId: string, stored: string | undefined): string {
  const list = variantsFor(sectionId);
  if (list.length === 0) return "";
  if (stored && list.some((v) => v.key === stored)) return stored;
  return list[0].key;
}

/** The chosen layout's own entry, for a label in the layers tree or inspector. */
export function variantMeta(sectionId: string, stored: string | undefined): SectionVariant | undefined {
  const key = resolveVariantKey(sectionId, stored);
  return variantsFor(sectionId).find((v) => v.key === key);
}
