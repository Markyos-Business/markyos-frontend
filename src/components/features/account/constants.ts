import type { AccountTab } from "./types";

export const ACCOUNT_TABS: { key: AccountTab; label: string; arLabel: string; icon: string }[] = [
  { key: "profile", label: "Profile", arLabel: "الملف الشخصي", icon: "user" },
  { key: "billing", label: "Subscription", arLabel: "الاشتراك", icon: "credit-card" },
  { key: "organisation", label: "Organisation", arLabel: "المؤسسة", icon: "shield-alt" },
];

export const isAccountTab = (v: string | null): v is AccountTab => v === "profile" || v === "billing" || v === "organisation";

export const SSO_PROVIDERS = ["Okta", "Azure AD", "Google"];
