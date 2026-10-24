import type { Account, AccountType } from "@/types";

type Limits = {
  /** Brands the account may own; `null` is no limit. */
  brands: number | null;
  /** Editors on one brand; `null` is no limit. Viewers and clients never count. */
  editors: number | null;
};

type Prices = {
  /** One-time client access pass, per brand, in USD. */
  pass: number;
  /** Monthly subscription, per brand, in USD. */
  subscription: number;
};

type AccountTypeInfo = {
  label: string;
  arLabel: string;
  /** One line under the label on the signup form. */
  description: string;
  icon: string;
  limits: Limits;
  prices: Prices;
  /** The brands home: its title and what a brand is to this account. */
  home: { title: string; noun: string; nounPlural: string };
  /** The first screen after signup, and every new brand after it. */
  newBrand: { title: string; description: string };
};

/**
 * Studios, freelancers and companies: what each account type is called,
 * what it may have and what it pays.
 *
 * The limits mirror the backend's `apps/accounts/limits.py`, which is what
 * actually enforces them; this copy is here to explain a limit before it is
 * hit. Prices are per brand, and the checkout route reads the type from the
 * server rather than from the browser.
 */
const ACCOUNT_TYPES: Record<AccountType, AccountTypeInfo> = {
  studio: {
    label: "Studio",
    arLabel: "استوديو",
    description: "Run brands for your clients, with a team.",
    icon: "users",
    limits: { brands: null, editors: null },
    prices: { pass: 19, subscription: 29 },
    home: { title: "Your clients' brands", noun: "client brand", nounPlural: "client brands" },
    newBrand: { title: "Add a client brand", description: "One workspace per client brand. You can rename it later." },
  },
  freelancer: {
    label: "Freelancer",
    arLabel: "مستقل",
    description: "Work solo on up to 3 client brands.",
    icon: "user",
    limits: { brands: 3, editors: 0 },
    prices: { pass: 15, subscription: 19 },
    home: { title: "Your clients' brands", noun: "client brand", nounPlural: "client brands" },
    newBrand: { title: "Add a client brand", description: "One workspace per client brand, up to 3. You can rename it later." },
  },
  company: {
    label: "Company",
    arLabel: "شركة",
    description: "Govern your own brand across departments.",
    icon: "sitemap",
    limits: { brands: 1, editors: null },
    prices: { pass: 49, subscription: 99 },
    home: { title: "Your brand", noun: "brand", nounPlural: "brands" },
    newBrand: {
      title: "Name your brand",
      description: "Its guideline, departments and governance live in one workspace. You can rename it later.",
    },
  },
};

const ACCOUNT_TYPE_KEYS = Object.keys(ACCOUNT_TYPES) as AccountType[];

const NO_LIMITS: Limits = { brands: null, editors: null };

/**
 * The account's type. A browser-only account from before types existed is a
 * studio, as the backend's migration made every existing account.
 */
const accountTypeOf = (account: Account | null): AccountType => account?.accountType ?? "studio";

/** What the account may have. Platform admins have no limits. */
const limitsOf = (account: Account | null): Limits =>
  account?.isAdmin ? NO_LIMITS : ACCOUNT_TYPES[accountTypeOf(account)].limits;

export { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS, accountTypeOf, limitsOf };
export type { AccountTypeInfo, Limits, Prices };
