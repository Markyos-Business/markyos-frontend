import type { Account, AccountType } from "@/types";

type AccountTypeInfo = {
  label: string;
  arLabel: string;
  /** One line under the label on the signup form. */
  description: string;
  arDescription: string;
  icon: string;
  /** The brands home: its title and what a brand is to this account. */
  home: { title: string; noun: string; nounPlural: string };
  /** The same in Arabic. */
  arHome: { title: string; noun: string; nounPlural: string };
  /** The first screen after signup, and every new brand after it. */
  newBrand: { title: string; description: string };
  arNewBrand: { title: string; description: string };
};

/**
 * Studios, freelancers and companies: what each account type is called.
 *
 * Prices and limits are not kept here: they come from the server's
 * /billing/plans/ (features/billing, usePlans and useLimits), which is what
 * the backend enforces and charges (billing epic 2.1).
 */
const ACCOUNT_TYPES: Record<AccountType, AccountTypeInfo> = {
  studio: {
    label: "Studio",
    arLabel: "استوديو",
    description: "Run brands for your clients, with a team.",
    arDescription: "أدِر علامات عملائك مع فريقك.",
    icon: "users",
    home: { title: "Your clients' brands", noun: "client brand", nounPlural: "client brands" },
    arHome: { title: "علامات عملائك", noun: "علامة عميل", nounPlural: "علامات عملاء" },
    newBrand: { title: "Add a client brand", description: "One per client brand. You can rename it later." },
    arNewBrand: { title: "أضف علامة عميل", description: "واحدة لكل علامة عميل، ويمكنك إعادة تسميتها لاحقًا." },
  },
  freelancer: {
    label: "Freelancer",
    arLabel: "مستقل",
    description: "Work solo on your client brands.",
    arDescription: "اعمل منفردًا على علامات عملائك.",
    icon: "user",
    home: { title: "Your clients' brands", noun: "client brand", nounPlural: "client brands" },
    arHome: { title: "علامات عملائك", noun: "علامة عميل", nounPlural: "علامات عملاء" },
    newBrand: { title: "Add a client brand", description: "One per client brand. You can rename it later." },
    arNewBrand: { title: "أضف علامة عميل", description: "واحدة لكل علامة عميل، ويمكنك إعادة تسميتها لاحقًا." },
  },
  company: {
    label: "Company",
    arLabel: "شركة",
    description: "Govern your own brand across departments.",
    arDescription: "أدِر علامتك الخاصة عبر أقسام شركتك.",
    icon: "sitemap",
    home: { title: "Your brand", noun: "brand", nounPlural: "brands" },
    arHome: { title: "علامتك", noun: "علامة", nounPlural: "علامات" },
    newBrand: {
      title: "Name your brand",
      description: "Its guideline, departments and governance live in one place. You can rename it later.",
    },
    arNewBrand: {
      title: "سمِّ علامتك",
      description: "دليلها وأقسامها وحوكمتها في مكان واحد، ويمكنك إعادة تسميتها لاحقًا.",
    },
  },
};

const ACCOUNT_TYPE_KEYS = Object.keys(ACCOUNT_TYPES) as AccountType[];

/**
 * The account's type. A browser-only account from before types existed is a
 * studio, as the backend's migration made every existing account.
 */
const accountTypeOf = (account: Account | null): AccountType => account?.accountType ?? "studio";

export { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS, accountTypeOf };
export type { AccountTypeInfo };
