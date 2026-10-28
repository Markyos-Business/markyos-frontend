import type { Account, AccountRole, AccountType, Lang } from "@/types";

/** The account as the backend sends it (`AccountSerializer`). */
export interface ApiAccount {
  id: string;
  name: string;
  email: string;
  adminLang: Lang | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string | null;
  role: AccountRole;
  accountType: AccountType | null;
  isAdmin: boolean;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
}

export interface Strength {
  /** 0–4. */
  score: number;
  label: string;
  /** The single most useful thing to do next, or null when it's strong. */
  advice: string | null;
}

/** Where the reset flow is. */
export type ResetStep = "request" | "sent" | "confirm";

/** What `POST /auth/google/` takes. */
export type GoogleSignInBody = {
  code?: string;
  signupToken?: string;
  accountType?: AccountType;
  remember?: boolean;
};

/** What it answers: signed in, or a new person who still has to pick a type. */
export type GoogleSignInResponse =
  | { needsAccountType?: false; access: string }
  | { needsAccountType: true; signupToken: string; name: string; email: string };

/** A Google identity with no account yet, waiting for its account type. */
export type GooglePendingSignup = { signupToken: string; name: string; email: string };

export type GoogleSignInResult =
  | { kind: "signedIn"; account: Account }
  | ({ kind: "needsAccountType" } & GooglePendingSignup);

/** An account waiting for its email code: what the verify step needs. */
export type PendingVerification = { email: string; codeSent: boolean; remember: boolean };

/** The server asked for the email code instead of signing in. */
export type VerificationRequired = { requiresVerification: true; email: string; codeSent: boolean };

/** A new account waiting for its "set your password" email. */
export type PasswordSetup = { email: string; emailSent: boolean };

/** What `POST /auth/signup/` answers: the account exists, the link is on its way. */
export type SignupResponse = { requiresPasswordSetup: true } & PasswordSetup;

/**
 * What signup and login resolve to in the store: done (`{}`), an error, the
 * emailed code to enter (`verify`), or the emailed link to follow (`setup`).
 */
export type AuthOutcome = { error?: string; verify?: PendingVerification; setup?: PasswordSetup };

/** A password set from an emailed link: signed in, and whether it was a new account's first. */
export type PasswordSetResult = { error?: string; firstTime?: boolean };

