import type { AccountType, Lang } from "@/types";

/**
 * What each account type gets: the one place that decides it, so screens ask
 * here instead of testing `type === "company"` themselves.
 *
 * Studios and freelancers make brands for clients; a company runs its own
 * brand, so client tools (the board of client brands) don't apply to it.
 * These flags shape what the app shows. The server stays the authority on
 * what an account may do: nothing here grants access.
 */
export function accountCapabilities(type: AccountType) {
  const company = type === "company";
  return {
    /** The board of client brands by stage. */
    board: !company,
    /** Who the brand is for: the studio's client, or the company's own team and partners. */
    audience: company ? "team" : "client",
  } as const;
}

/** Account wording changes the audience, never the underlying server role. */
export function accountExperience(type: AccountType, lang: Lang) {
  const company = accountCapabilities(type).audience === "team";
  if (lang === "ar") return {
    reviewerLabel: company ? "مراجع خارجي" : "عميل",
    accessTitle: company ? "وصول الفريق والشركاء" : "وصول العميل",
    reviewTitle: company ? "مراجعة الفريق والشركاء" : "مراجعة العميل",
    sharedAudience: company ? "مشاركة مع الفريق والشركاء" : "مشاركة مع العملاء",
    domainHint: company ? "شارك دليل علامتك عبر نطاق شركتك، مثل brand.yourcompany.com." : "شارك دليل العميل عبر نطاقك الخاص، مثل brand.yourstudio.com.",
    discoveryIntro: company
      ? "ما قاله فريقك وشركاؤك: إجاباتهم على الاستبيان، وملاحظاتك من المكالمات. يقرأ التحليل كليهما."
      : "ما قاله العميل: إجاباته على الاستبيان، وملاحظاتك من المكالمات. يقرأ التحليل كليهما.",
    questionnaireEmpty: company
      ? "أنشئ استبيانًا، ثم انسخ رابطه وأرسله إلى فريقك أو شركائك. ستظهر إجاباتهم هنا."
      : "أنشئ استبيانًا، ثم انسخ رابطه وأرسله إلى عميلك. ستظهر إجاباته هنا.",
    linkReady: company ? "الرابط جاهز ونُسخ. أرسله إلى من تريد سؤاله." : "الرابط جاهز ونُسخ. أرسله إلى عميلك.",
    linkCopied: company ? "نُسخ الرابط. أرسله إلى من تريد سؤاله." : "نُسخ الرابط. أرسله إلى عميلك.",
    openAnswerPage: company ? "فتح صفحة الاستبيان" : "فتح صفحة العميل",
    brandLanguageHint: company
      ? "اللغة التي يفتح بها موقع الدليل، عند النشر القادم. لغة واجهتك أنت إعداد منفصل في الشريط الأعلى."
      : "اللغة التي يفتح بها موقع الدليل عند العميل، عند النشر القادم. لغة واجهتك أنت إعداد منفصل في الشريط الأعلى.",
    brandLanguageArabic: company ? "لغة الهوية: العربية. تظهر في الدليل عند النشر." : "لغة الهوية: العربية. تصل إلى العميل عند النشر.",
    brandLanguageEnglish: company ? "لغة الهوية: الإنجليزية. تظهر في الدليل عند النشر." : "لغة الهوية: الإنجليزية. تصل إلى العميل عند النشر.",
    guidelineLink: company ? "رابط الدليل" : "رابط العميل",
  };
  return {
    reviewerLabel: company ? "External reviewer" : "Client",
    accessTitle: company ? "Team & partner access" : "Client access",
    reviewTitle: company ? "Team & partner review" : "Client review",
    sharedAudience: company ? "shared with your team and partners" : "shared with clients",
    domainHint: company ? "Share your brand guideline on your company's domain, such as brand.yourcompany.com." : "Share your client's guideline on your own domain, such as brand.yourstudio.com.",
    discoveryIntro: company
      ? "What your team and partners told you: their answers to the questionnaire, and your notes from calls. The analysis reads both."
      : "What the client told you: their answers to the questionnaire, and your notes from calls. The analysis reads both.",
    questionnaireEmpty: company
      ? "Write a questionnaire, then copy its link and send it to your team or partners. Their answers appear here."
      : "Write a questionnaire, then copy its link and send it to your client. Their answers appear here.",
    linkReady: company ? "Link ready and copied. Send it to the people you're asking." : "Link ready and copied. Send it to your client.",
    linkCopied: company ? "Link copied. Send it to the people you're asking." : "Link copied. Send it to your client.",
    openAnswerPage: company ? "Open the questionnaire page" : "Open the client's page",
    brandLanguageHint: company
      ? "Which language the guideline opens in, from the next publish. Your own interface language is a separate setting in the top bar."
      : "Which language the client's guideline opens in, from the next publish. Your own interface language is a separate setting in the top bar.",
    brandLanguageArabic: company ? "Brand language set to Arabic. It reaches the guideline when you publish." : "Brand language set to Arabic. Publish to show clients.",
    brandLanguageEnglish: company ? "Brand language set to English. It reaches the guideline when you publish." : "Brand language set to English. Publish to show clients.",
    guidelineLink: company ? "guideline link" : "client link",
  };
}
