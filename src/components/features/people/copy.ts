// Every word the People page says, in English and Arabic (spec §7).

const en = {
  title: "People",
  description: "Everyone on your brands, in one place",
  invite: "Invite people",
  roles: { editor: "Editor", viewer: "Viewer", client: "Client" },
  roleHelp: {
    editor: "Editor: works on the brand.",
    viewer: "Viewer: reads it, changes nothing.",
    client: "Client: reviews and signs off.",
  },
  search: "Search name or email",
  searchLabel: "Search people",
  role: "Role",
  allRoles: "All roles",
  table: {
    label: "People",
    itemLabel: "people",
    person: "Person",
    brands: "Brands",
    count: "On",
    countValue: (n: number) => (n === 1 ? "1 brand" : `${n} brands`),
  },
  actions: {
    manage: "Manage access",
    removeAll: "Remove from all brands",
  },
  empty: {
    noBrandsTitle: "No brands of your own yet",
    noBrandsBody: "Create a brand, then invite people to work on it.",
    noPeopleTitle: "Nobody else is on your brands yet",
    noPeopleBody: "Invite someone to work on one or more brands.",
    noMatchTitle: (q: string) => (q ? `No people match “${q}”.` : "No people match these filters."),
    noMatchBody: "Try another name, or clear the filters.",
    clear: "Clear filters",
  },
  sheet: {
    title: (name: string) => `${name}'s access`,
    description: "Their role on each of your brands. Choose Remove to take them off one.",
    remove: "Remove from this brand",
    save: "Save changes",
    nothing: "Nothing changed.",
    removeAllHint: "Taking them off every brand is in the row's menu.",
  },
  confirm: {
    removeTitle: (name: string, n: number) => (n === 1 ? `Remove ${name} from 1 brand?` : `Remove ${name} from ${n} brands?`),
    removeBody: "They lose access straight away. You can invite them again later.",
    removeAllTitle: (name: string) => `Remove ${name} from all your brands?`,
    remove: "Remove",
  },
  inviteDialog: {
    title: "Invite people",
    description: "Each person is added to the brands you tick. Anyone new gets an email to set their password.",
    emails: "Emails",
    emailsHint: "Separate several with commas.",
    name: "Name",
    nameHint: "Optional, for one person.",
    role: "Role",
    brands: "Brands",
    submit: "Send invites",
    emailsRequired: "Enter at least one email.",
    emailInvalid: (email: string) => `“${email}” isn't a valid email.`,
    tooMany: "Invite up to 20 people at a time.",
    brandsRequired: "Tick at least one brand.",
    editorsFull: (brand: string) => `${brand} has no editor seats left. Choose Viewer or Client.`,
    soloNoEditors: "Your account works solo, so it can't add editors. Choose Viewer or Client.",
    alreadyOn: (email: string, brand: string) => `${email} is already on ${brand}.`,
  },
  toasts: {
    saved: "Access updated.",
    removed: (name: string) => `${name} was removed.`,
    invited: (people: number, brands: number) =>
      `${people === 1 ? "1 person" : `${people} people`} added to ${brands === 1 ? "1 brand" : `${brands} brands`}.`,
  },
};

type PeopleCopy = typeof en;

const ar: PeopleCopy = {
  title: "الأشخاص",
  description: "كل من يعمل على علاماتك في مكان واحد",
  invite: "دعوة أشخاص",
  roles: { editor: "محرّر", viewer: "مشاهد", client: "عميل" },
  roleHelp: {
    editor: "محرّر: يعمل على العلامة.",
    viewer: "مشاهد: يقرأ فقط ولا يغيّر شيئًا.",
    client: "عميل: يراجع ويعتمد.",
  },
  search: "ابحث بالاسم أو البريد",
  searchLabel: "البحث عن أشخاص",
  role: "الدور",
  allRoles: "كل الأدوار",
  table: {
    label: "الأشخاص",
    itemLabel: "أشخاص",
    person: "الشخص",
    brands: "العلامات",
    count: "على",
    countValue: (n) => (n === 1 ? "علامة واحدة" : `${n} علامات`),
  },
  actions: {
    manage: "إدارة الوصول",
    removeAll: "إزالة من كل العلامات",
  },
  empty: {
    noBrandsTitle: "لا توجد علامات خاصة بك بعد",
    noBrandsBody: "أنشئ علامة ثم ادعُ أشخاصًا للعمل عليها.",
    noPeopleTitle: "لا أحد غيرك على علاماتك بعد",
    noPeopleBody: "ادعُ شخصًا للعمل على علامة أو أكثر.",
    noMatchTitle: (q) => (q ? `لا يوجد أشخاص يطابقون «${q}».` : "لا يوجد أشخاص يطابقون عوامل التصفية."),
    noMatchBody: "جرّب اسمًا آخر أو امسح عوامل التصفية.",
    clear: "مسح عوامل التصفية",
  },
  sheet: {
    title: (name) => `وصول ${name}`,
    description: "دوره على كل علامة من علاماتك. اختر «إزالة» لإخراجه من إحداها.",
    remove: "إزالة من هذه العلامة",
    save: "حفظ التغييرات",
    nothing: "لم يتغيّر شيء.",
    removeAllHint: "إزالته من كل العلامات موجودة في قائمة الصف.",
  },
  confirm: {
    removeTitle: (name, n) => (n === 1 ? `إزالة ${name} من علامة واحدة؟` : `إزالة ${name} من ${n} علامات؟`),
    removeBody: "يفقد الوصول فورًا. يمكنك دعوته مجددًا لاحقًا.",
    removeAllTitle: (name) => `إزالة ${name} من كل علاماتك؟`,
    remove: "إزالة",
  },
  inviteDialog: {
    title: "دعوة أشخاص",
    description: "يُضاف كل شخص إلى العلامات التي تحددها. يصل لكل شخص جديد بريد لتعيين كلمة المرور.",
    emails: "البريد الإلكتروني",
    emailsHint: "افصل بين العناوين بفواصل.",
    name: "الاسم",
    nameHint: "اختياري، لشخص واحد.",
    role: "الدور",
    brands: "العلامات",
    submit: "إرسال الدعوات",
    emailsRequired: "أدخل بريدًا إلكترونيًا واحدًا على الأقل.",
    emailInvalid: (email) => `«${email}» ليس بريدًا إلكترونيًا صحيحًا.`,
    tooMany: "ادعُ حتى 20 شخصًا في المرة الواحدة.",
    brandsRequired: "حدّد علامة واحدة على الأقل.",
    editorsFull: (brand) => `لا توجد مقاعد محرّرين متبقية في ${brand}. اختر مشاهد أو عميل.`,
    soloNoEditors: "حسابك يعمل منفردًا، فلا يمكنه إضافة محرّرين. اختر مشاهد أو عميل.",
    alreadyOn: (email, brand) => `${email} موجود بالفعل في ${brand}.`,
  },
  toasts: {
    saved: "تم تحديث الوصول.",
    removed: (name) => `تمت إزالة ${name}.`,
    invited: (people, brands) => `تمت إضافة ${people === 1 ? "شخص واحد" : `${people} أشخاص`} إلى ${brands === 1 ? "علامة واحدة" : `${brands} علامات`}.`,
  },
};

const PEOPLE_COPY = { en, ar } as const;

export { PEOPLE_COPY };
export type { PeopleCopy };
