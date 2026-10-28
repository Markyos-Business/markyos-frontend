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

/** What signup and login resolve to in the store: done, an error, or "check your email". */
export type AuthOutcome = { error?: string; verify?: PendingVerification };

