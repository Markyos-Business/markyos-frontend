import { BlockKind } from "@/types";

/**
 * The element palette, in one place.
 *
 * Shared by the builder's sidebar and the "+" menu that appears between
 * sections on the canvas, so the two can't drift into offering different sets
 * of elements or describing the same one two ways.
 */

export type BlockCategory = "brand" | "text" | "media" | "layout" | "forms" | "social";

export const CATEGORY_META: Record<BlockCategory, { label: string; arLabel: string; icon: string }> = {
  brand: { label: "Brand", arLabel: "الهوية", icon: "shapes" },
  text: { label: "Text", arLabel: "نص", icon: "heading" },
  media: { label: "Media", arLabel: "وسائط", icon: "image" },
  layout: { label: "Layout", arLabel: "التخطيط", icon: "sliders" },
  forms: { label: "Forms", arLabel: "النماذج", icon: "envelope" },
  social: { label: "Social", arLabel: "تواصل اجتماعي", icon: "share-square" },
};

export const CATEGORY_ORDER: BlockCategory[] = ["brand", "text", "media", "layout", "forms", "social"];

export interface BlockMeta {
  category: BlockCategory;
  label: string;
  arLabel: string;
  icon: string;
  hint: string;
  arHint: string;
  /** Offered in the compact "+" menu on the canvas, not only in the sidebar. */
  common?: boolean;
}

export const BLOCK_META: Record<BlockKind, BlockMeta> = {
  // "Brand" blocks are live views of the workspace's own design-system data
  // — not static content. Edit the colors/logo/type/icons anywhere in the
  // app and every one of these updates automatically wherever it's placed.
  brandLogo: { category: "brand", label: "Logo", arLabel: "الشعار", icon: "shapes", hint: "Live view of your current logo system.", arHint: "عرض حي لنظام الشعار الحالي." },
  brandColors: { category: "brand", label: "Color palette", arLabel: "لوحة الألوان", icon: "palette", hint: "Live view of your current brand colors.", arHint: "عرض حي لألوان الهوية الحالية." },
  brandType: { category: "brand", label: "Type specimen", arLabel: "عيّنة الخط", icon: "font", hint: "Live view of your current typography.", arHint: "عرض حي للخطوط الحالية." },
  brandIcons: { category: "brand", label: "Icon collection", arLabel: "مجموعة الأيقونات", icon: "shapes", hint: "Live view of your uploaded icon assets.", arHint: "عرض حي لأيقونات الهوية المرفوعة." },
  files: { category: "brand", label: "Files", arLabel: "ملفات", icon: "file-alt", hint: "Downloadable brand documents — PDFs, fonts, exports.", arHint: "مستندات الهوية القابلة للتحميل — PDF، خطوط، ملفات تصدير." },
  text: { category: "text", label: "Text", arLabel: "نص", icon: "heading", hint: "A heading and a paragraph.", arHint: "عنوان وفقرة نصية.", common: true },
  quote: { category: "text", label: "Quote", arLabel: "اقتباس", icon: "quote-right", hint: "A callout quote or testimonial.", arHint: "اقتباس أو شهادة عميل.", common: true },
  stat: { category: "text", label: "Stat", arLabel: "إحصائية", icon: "chart-line", hint: "A big number with a caption.", arHint: "رقم كبير مع وصف." },
  faq: { category: "text", label: "FAQ item", arLabel: "سؤال شائع", icon: "question-circle", hint: "An expandable question and answer.", arHint: "سؤال وجواب قابل للتوسيع." },
  image: { category: "media", label: "Image", arLabel: "صورة", icon: "image", hint: "One image from your assets.", arHint: "صورة واحدة من الأصول.", common: true },
  gallery: { category: "media", label: "Gallery", arLabel: "معرض صور", icon: "shapes", hint: "A grid of images.", arHint: "شبكة من الصور.", common: true },
  video: { category: "media", label: "Video", arLabel: "فيديو", icon: "play", hint: "Embed a YouTube or Vimeo link.", arHint: "تضمين رابط يوتيوب أو فيميو." },
  columns: {
    category: "layout",
    label: "Columns",
    arLabel: "أعمدة",
    icon: "grip-vertical",
    hint: "Lay blocks side by side in 2 or 3 columns.",
    arHint: "ضع العناصر جنبًا إلى جنب في عمودين أو ثلاثة.",
    common: true,
  },
  divider: { category: "layout", label: "Divider", arLabel: "فاصل", icon: "sliders", hint: "A plain visual break.", arHint: "فاصل بصري بسيط.", common: true },
  spacer: { category: "layout", label: "Spacer", arLabel: "مسافة فارغة", icon: "arrows-v", hint: "Extra vertical breathing room.", arHint: "مسافة رأسية إضافية." },
  button: { category: "layout", label: "Button", arLabel: "زر", icon: "link", hint: "A single call-to-action link.", arHint: "زر رابط واحد.", common: true },
  form: { category: "forms", label: "Contact form", arLabel: "نموذج تواصل", icon: "id-badge", hint: "Opens the visitor's email client.", arHint: "يفتح تطبيق البريد لدى الزائر." },
  embed: {
    category: "forms",
    label: "Embed HTML",
    arLabel: "تضمين HTML",
    icon: "file-code",
    hint: "Paste a Calendly, Typeform, Mailchimp… snippet, or your own HTML.",
    arHint: "ألصق كود Calendly أو Typeform أو Mailchimp أو أي HTML خاص بك.",
  },
  socialLinks: { category: "social", label: "Social links", arLabel: "روابط التواصل", icon: "share-square", hint: "A row of profile links.", arHint: "صف من روابط الحسابات." },
};

export const ALL_BLOCK_KINDS = Object.keys(BLOCK_META) as BlockKind[];

/** The short list offered inline on the canvas; the sidebar carries them all. */
export const COMMON_BLOCK_KINDS = ALL_BLOCK_KINDS.filter((k) => BLOCK_META[k].common);
