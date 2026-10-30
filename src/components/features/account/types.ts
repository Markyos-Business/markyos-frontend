export type AccountTab = "profile" | "billing" | "organisation";

/** Field errors on the change-password form. */
export type PasswordErrors = { current?: string; next?: string; confirm?: string };

/** A link the account menu shows on phones, where the top bar has no room. */
export type MenuLink = { href: string; label: string; arLabel: string; icon: string };

/** A row of `GET /auth/sessions/`: one browser you're signed in on. */
export interface MySession {
  id: string;
  browser: string | null;
  os: string | null;
  mobile: boolean;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  /** The browser this page is open in. */
  current: boolean;
}

/** Proof it's you: the password, or for a Google-only account its email typed out. */
export type Confirmation = { password: string } | { email: string };
