import { plural } from "@/lib/i18n/plural";

/*
 * Every Help Center string, keyed screen.element(.state), in both languages
 * together. Worded as a draft until the copy guide «دليل نصوص الواجهة» arrives;
 * the keys stay when the wording changes.
 */

/** Icons a category can use, from the kit's Line Awesome set. */
export const CATEGORY_ICONS = [
  "question-circle", "book", "play", "user", "users", "lock", "key", "credit-card", "cog", "palette", "shapes",
  "image", "file-alt", "clipboard-list", "chart-line", "bullseye", "layer-group", "globe", "language", "sitemap",
  "shield-alt", "envelope", "sliders", "star",
] as const;

const en = {
  categories: {
    title: "Help categories",
    description: "How the Help Center is organised. Categories hold subcategories one level deep; visitors see them in this order.",
    add: "Add category",
    empty: { title: "No categories yet.", body: "Add the first one, then its subcategories." },
    table: { label: "Help categories", item: "categories" },
    columns: { name: "Category", slug: "Slug", visibility: "Who sees it", status: "Status", articles: "Articles" },
    visibility: { public: "Everyone", signed_in: "Signed-in users" },
    status: { active: "Shown", hidden: "Hidden" },
    sub: "Subcategory of {parent}",
    untitled: "Untitled",
    articles: (n: number) => plural("en", n, { one: "{n} article", other: "{n} articles" }),
    actions: {
      edit: "Edit",
      addSub: "Add subcategory",
      moveUp: "Move up",
      moveDown: "Move down",
      hide: "Hide",
      show: "Show",
      remove: "Delete",
      removeBlocked: "Move or archive its articles and subcategories first.",
    },
    confirmRemove: { title: (name: string) => `Delete ${name}?`, body: "It disappears from the Help Center. This can't be undone.", confirm: "Delete" },
    form: {
      addTitle: "Add category",
      addSubTitle: "Add subcategory",
      editTitle: "Edit category",
      save: "Save",
      titleEn: "Title (English)",
      titleAr: "Title (Arabic)",
      slugEn: "Slug (English)",
      slugAr: "Slug (Arabic)",
      slugHint: "The address in the Help Center. Letters, digits and hyphens.",
      descriptionEn: "Description (English)",
      descriptionAr: "Description (Arabic)",
      icon: "Icon",
      iconNone: "No icon",
      parent: "Parent",
      parentNone: "None (a top-level category)",
      parentLocked: "It has subcategories, so it stays top-level.",
      visibility: "Who sees it",
      status: "Status",
    },
    toast: { saved: "Category saved.", removed: "Category deleted.", moved: "Order saved.", hidden: "Category hidden.", shown: "Category shown." },
    errors: {
      title: "Give the category a title in at least one language.",
      slug: "Check the slug: letters, digits and hyphens, not used by another category, and one for each titled language.",
      parent: "Subcategories go one level deep: a subcategory can't hold its own, and a category with subcategories can't become one.",
      hasArticles: "This category still has articles. Move or archive them first.",
      hasChildren: "This category has subcategories. Move or delete them first.",
    },
  },
};

type HelpCopy = typeof en;

const ar: HelpCopy = {
  categories: {
    title: "تصنيفات المساعدة",
    description: "طريقة تنظيم مركز المساعدة. يضم كل تصنيف تصنيفات فرعية بمستوى واحد، ويراها الزوار بهذا الترتيب.",
    add: "إضافة تصنيف",
    empty: { title: "لا تصنيفات بعد.", body: "أضف التصنيف الأول، ثم تصنيفاته الفرعية." },
    table: { label: "تصنيفات المساعدة", item: "تصنيفات" },
    columns: { name: "التصنيف", slug: "المعرّف في الرابط", visibility: "من يراه", status: "الحالة", articles: "المقالات" },
    visibility: { public: "الجميع", signed_in: "المستخدمون المسجّلون" },
    status: { active: "ظاهر", hidden: "مخفي" },
    sub: "تصنيف فرعي من {parent}",
    untitled: "بلا عنوان",
    articles: (n: number) => plural("ar", n, { zero: "لا مقالات", one: "مقالة واحدة", two: "مقالتان", few: "{n} مقالات", many: "{n} مقالة", other: "{n} مقالة" }),
    actions: {
      edit: "تعديل",
      addSub: "إضافة تصنيف فرعي",
      moveUp: "نقل للأعلى",
      moveDown: "نقل للأسفل",
      hide: "إخفاء",
      show: "إظهار",
      remove: "حذف",
      removeBlocked: "انقل مقالاته وتصنيفاته الفرعية أو أرشفها أولًا.",
    },
    confirmRemove: { title: (name: string) => `حذف ${name}؟`, body: "سيختفي من مركز المساعدة، ولا يمكن التراجع عن ذلك.", confirm: "حذف" },
    form: {
      addTitle: "إضافة تصنيف",
      addSubTitle: "إضافة تصنيف فرعي",
      editTitle: "تعديل التصنيف",
      save: "حفظ",
      titleEn: "العنوان (بالإنجليزية)",
      titleAr: "العنوان (بالعربية)",
      slugEn: "المعرّف (بالإنجليزية)",
      slugAr: "المعرّف (بالعربية)",
      slugHint: "الجزء الذي يظهر في رابط مركز المساعدة: حروف وأرقام وشرطات.",
      descriptionEn: "الوصف (بالإنجليزية)",
      descriptionAr: "الوصف (بالعربية)",
      icon: "الأيقونة",
      iconNone: "بلا أيقونة",
      parent: "التصنيف الأعلى",
      parentNone: "لا شيء (تصنيف رئيسي)",
      parentLocked: "لديه تصنيفات فرعية، لذا يبقى تصنيفًا رئيسيًا.",
      visibility: "من يراه",
      status: "الحالة",
    },
    toast: { saved: "حُفظ التصنيف.", removed: "حُذف التصنيف.", moved: "حُفظ الترتيب.", hidden: "أُخفي التصنيف.", shown: "أُظهر التصنيف." },
    errors: {
      title: "أضف عنوانًا للتصنيف بلغة واحدة على الأقل.",
      slug: "راجع المعرّف: حروف وأرقام وشرطات، وغير مستخدم في تصنيف آخر، وواحد لكل لغة لها عنوان.",
      parent: "التصنيفات الفرعية بمستوى واحد: لا يضم التصنيف الفرعي تصنيفات أخرى، ولا يصبح التصنيف الذي له فروع تصنيفًا فرعيًا.",
      hasArticles: "ما زالت في هذا التصنيف مقالات. انقلها أو أرشفها أولًا.",
      hasChildren: "لهذا التصنيف تصنيفات فرعية. انقلها أو احذفها أولًا.",
    },
  },
};

export const HELP_COPY = { en, ar };
export type { HelpCopy };
