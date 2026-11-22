import type { Lang } from "@/types/lang";

type Name = readonly [string, string];
const pages: Record<string, Name> = {
  "/": ["Log in", "تسجيل الدخول"], "/login": ["Log in", "تسجيل الدخول"],
  "/signup": ["Create account", "إنشاء حساب"], "/reset": ["Reset password", "إعادة تعيين كلمة المرور"],
  "/confirm-email": ["Confirm email", "تأكيد البريد الإلكتروني"],
  "/brands": ["Brands", "العلامات"], "/brands/new": ["New brand", "علامة جديدة"],
  "/studio/board": ["Brand board", "لوحة العلامات"], "/account": ["Account", "الحساب"],
  "/notifications": ["Notifications", "الإشعارات"],
  "/people": ["People", "الأشخاص"], "/forms": ["Questionnaires", "الاستبيانات"], "/forms/new": ["New questionnaire", "استبيان جديد"],
  "/templates": ["Templates", "القوالب"], "/design-system": ["UI gallery", "معرض الواجهة"],
  "/design-system/dashboard": ["Dashboard widgets", "مكونات لوحة المعلومات"],
  "/design-system/filters": ["Filter gallery", "معرض عوامل التصفية"],
  "/design-system/popups": ["Popup gallery", "معرض النوافذ"],
  "/design-system/tabs": ["Tabs gallery", "معرض التبويبات"],
  "/design-system/forms": ["Forms gallery", "معرض النماذج"], "/design-system/form-structure": ["Form structure gallery", "معرض بنية النماذج"], "/design-system/badge": ["Badge gallery", "معرض الشارة"], "/assets": ["Assets", "الأصول"], "/design-system/table-select": ["Table and select gallery", "معرض الجداول والقوائم"],
  "/dev/components": ["Component library", "مكتبة المكونات"], "/dev/motion": ["Motion library", "مكتبة الحركة"], "/dev/controls": ["Form controls", "عناصر النماذج"],
  "/admin": ["Administration", "الإدارة"], "/admin/users": ["Users", "المستخدمون"], "/admin/billing": ["Billing", "الفوترة"],
  "/admin/cms": ["Website content", "محتوى الموقع"],
  "/admin/cms/media": ["Media", "الوسائط"], "/admin/cms/taxonomy": ["Authors and labels", "الكُتّاب والتصنيفات"],
  "/admin/cms/redirects": ["Redirects", "إعادة التوجيه"], "/admin/cms/help/categories": ["Help categories", "تصنيفات المساعدة"], "/admin/cms/help/feedback": ["Article feedback", "آراء القرّاء"], "/admin/cms/help/analytics": ["Help Center analytics", "تحليلات مركز المساعدة"], "/admin/cms/help": ["Help articles", "مقالات المساعدة"], "/admin/cms/traffic": ["Website traffic", "زيارات الموقع"], "/admin/cms/people": ["CMS people", "فريق المحتوى"],
};
const brandPages: Record<string, Name> = {
  "": ["Overview", "نظرة عامة"], overview: ["Overview", "نظرة عامة"], assets: ["Assets", "الأصول"], builder: ["Guideline editor", "محرر الدليل"],
  strategy: ["Strategy", "الاستراتيجية"], "visual-identity": ["Visual identity", "الهوية البصرية"],
  moodboard: ["Moodboards", "الألواح الإلهامية"], brief: ["Brand brief", "ملخص العلامة"], team: ["Team", "الفريق"],
  compliance: ["Check", "التدقيق"], departments: ["Departments", "الأقسام"], discovery: ["Discovery", "الاكتشاف"],
  forms: ["Questionnaires", "الاستبيانات"], drafts: ["Drafts", "المسودات"],
  settings: ["Settings", "الإعدادات"],
};

/** No record IDs, tokens, question text or private public-share content in titles. */
export function routePageName(pathname: string): Name {
  const path = pathname.replace(/\/$/, "") || "/";
  if (pages[path]) return pages[path];
  if (/^\/admin\/users\/[^/]+$/.test(path)) return ["User details", "تفاصيل المستخدم"];
  if (/^\/admin\/billing\/[^/]+$/.test(path)) return ["Checkout details", "تفاصيل عملية الدفع"];
  if (/^\/admin\/cms\/articles\/[^/]+$/.test(path)) return ["Edit article", "تحرير المقال"];
  if (/^\/admin\/cms\/help\/articles\/[^/]+$/.test(path)) return ["Edit help article", "تحرير مقالة المساعدة"];
  if (/^\/help\/preview\/[^/]+$/.test(path)) return ["Help article preview", "معاينة مقالة المساعدة"];
  if (/^\/print\/analysis\/[^/]+$/.test(path)) return ["Analysis report", "تقرير التحليل"];
  if (/^\/v\/[^/]+(?:\/p\/[^/]+)?$/.test(path)) return ["Published guideline", "الدليل المنشور"];
  const share = path.match(/^\/([abfs])\/[^/]+$/)?.[1];
  if (share) return ({ a: ["Shared analysis", "تحليل مشترك"], b: ["Shared brief", "ملخص مشترك"], f: ["Questionnaire", "استبيان"], s: ["Shared strategy", "استراتيجية مشتركة"] } as Record<string, Name>)[share];
  const brand = path.match(/^\/w\/[^/]+(?:\/(.*))?$/);
  if (brand) {
    const rest = brand[1] ?? "";
    if (brandPages[rest]) return brandPages[rest];
    if (/^moodboard\/[^/]+$/.test(rest)) return ["Moodboard", "لوح إلهامي"];
    if (/^strategy\/[^/]+$/.test(rest)) return brandPages.strategy;
    if (rest === "forms/new") return ["New questionnaire", "استبيان جديد"];
    if (/^forms\/[^/]+\/edit$/.test(rest)) return ["Edit questionnaire", "تحرير الاستبيان"];
    if (/^forms\/[^/]+\/send$/.test(rest)) return ["Questionnaire theme and link", "تصميم الاستبيان ورابطه"];
    if (/^forms\/[^/]+\/answers$/.test(rest)) return ["Questionnaire answers", "إجابات الاستبيان"];
    if (rest === "discovery/calls/new") return ["New call note", "ملاحظة مكالمة جديدة"];
    if (/^discovery\/calls\/[^/]+\/edit$/.test(rest)) return ["Edit call note", "تحرير ملاحظة المكالمة"];
    if (/^discovery\/calls\/[^/]+$/.test(rest)) return ["Call note", "ملاحظة المكالمة"];
  }
  return ["Page", "صفحة"];
}

export function pageTitle(pathname: string, lang: Lang, workspaceName?: string): string {
  const name = routePageName(pathname)[lang === "ar" ? 1 : 0];
  // Only authenticated workspace routes may include an already-authorized name.
  const brand = /^\/w\/[^/]+(?:\/|$)/.test(pathname) ? workspaceName?.trim() : undefined;
  return [name, brand, "Markyos"].filter(Boolean).join(" · ");
}
