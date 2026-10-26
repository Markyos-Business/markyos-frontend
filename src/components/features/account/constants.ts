export type AccountTab = "profile" | "billing" | "organisation";

export const ACCOUNT_TABS: { key: AccountTab; label: string; icon: string }[] = [
  { key: "profile", label: "Profile", icon: "user" },
  { key: "billing", label: "Subscription", icon: "credit-card" },
  { key: "organisation", label: "Organisation", icon: "shield-alt" },
];

export const isAccountTab = (v: string | null): v is AccountTab => v === "profile" || v === "billing" || v === "organisation";

export const SSO_PROVIDERS = ["Okta", "Azure AD", "Google"];
