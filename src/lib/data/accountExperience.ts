import type { AccountType, Lang } from "@/types";

/** Account wording changes the audience, never the underlying server role. */
export function accountExperience(type: AccountType, lang: Lang) {
  const company = type === "company";
  if (lang === "ar") return {
    reviewerLabel: company ? "مراجع خارجي" : "عميل",
    accessTitle: company ? "وصول الفريق والشركاء" : "وصول العميل",
    reviewTitle: company ? "مراجعة الفريق والشركاء" : "مراجعة العميل",
    sharedAudience: company ? "مشاركة مع الفريق والشركاء" : "مشاركة مع العملاء",
    domainHint: company ? "شارك دليل علامتك عبر نطاق شركتك، مثل brand.yourcompany.com." : "شارك دليل العميل عبر نطاقك الخاص، مثل brand.yourstudio.com.",
  };
  return {
    reviewerLabel: company ? "External reviewer" : "Client",
    accessTitle: company ? "Team & partner access" : "Client access",
    reviewTitle: company ? "Team & partner review" : "Client review",
    sharedAudience: company ? "shared with your team and partners" : "shared with clients",
    domainHint: company ? "Share your brand guideline on your company's domain, such as brand.yourcompany.com." : "Share your client's guideline on your own domain, such as brand.yourstudio.com.",
  };
}
