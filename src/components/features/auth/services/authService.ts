import { ApiError, api, setAccessToken } from "@/lib/api/client";
import type { Account, AccountType, Lang } from "@/types";
import type {
  ApiAccount,
  GoogleSignInBody,
  GoogleSignInResponse,
  GoogleSignInResult,
  SignupResponse,
  VerificationRequired,
} from "../types";

const ms = (iso: string | null) => (iso ? Date.parse(iso) : null);

/**
 * The server's account in the store's `Account` shape.
 *
 * `password` is empty on purpose: with a backend, no form of the password —
 * not even a derived key — is kept in the browser.
 */
export function toAccount(a: ApiAccount): Account {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    password: "",
    passwordUpdatedAt: ms(a.passwordUpdatedAt),
    createdAt: ms(a.createdAt) ?? Date.now(),
    lastLoginAt: ms(a.lastLoginAt),
    adminLang: a.adminLang,
    role: a.role,
    accountType: a.accountType,
    isAdmin: a.isAdmin,
    avatarUrl: a.avatarUrl,
    twoFactorEnabled: a.twoFactorEnabled,
    pendingEmail: a.pendingEmail,
  };
}

export async function signup(
  name: string,
  email: string,
  accountType: AccountType
): Promise<SignupResponse> {
  // No password and no session yet: both come from the emailed link.
  return api<SignupResponse>("/auth/signup/", {
    method: "POST",
    body: { name, email, accountType },
  });
}

/** Confirms the signup code and signs in. */
export async function verifyEmail(email: string, code: string, remember = true): Promise<Account> {
  const res = await api<{ access: string }>("/auth/otp/verify/", {
    method: "POST",
    body: { email, code, purpose: "register", remember },
  });
  setAccessToken(res.access);
  return fetchMe();
}

/** Emails a fresh signup code. */
export async function resendVerification(email: string): Promise<void> {
  await api<void>("/auth/otp/resend/", { method: "POST", body: { email, purpose: "register" } });
}

export async function login(email: string, password: string, remember = true): Promise<Account | VerificationRequired> {
  const res = await api<{ access?: string; requires_otp?: boolean } | VerificationRequired>("/auth/login/", {
    method: "POST",
    body: { email, password, remember },
  });
  // Signed up but never confirmed: the server has emailed a fresh code.
  if ("requiresVerification" in res) return res;
  if (res.requires_otp || !res.access) {
    // Two-factor accounts are an NGO-era flow the Markyos UI has no screen for.
    throw new ApiError("This account needs a verification code, which this app can't take yet.", 403);
  }
  setAccessToken(res.access);
  return fetchMe();
}

/**
 * Continue with Google. Send the popup's `code`, or — for someone new — the
 * `signupToken` the first call returned plus the account type they picked.
 */
export async function googleSignIn(body: GoogleSignInBody): Promise<GoogleSignInResult> {
  const res = await api<GoogleSignInResponse>("/auth/google/", { method: "POST", body });
  if (res.needsAccountType) {
    return { kind: "needsAccountType", signupToken: res.signupToken, name: res.name, email: res.email };
  }
  setAccessToken(res.access);
  return { kind: "signedIn", account: await fetchMe() };
}

export async function logout(): Promise<void> {
  try {
    await api<void>("/auth/logout/", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<Account> {
  return toAccount(await api<ApiAccount>("/auth/me/"));
}

/** Sends the confirmation for a pending email change again. */
export async function resendEmailChange(): Promise<Account> {
  return toAccount(await api<ApiAccount>("/auth/email-change/", { method: "POST" }));
}

/** Drops a pending email change; the current email stays. */
export async function cancelEmailChange(): Promise<Account> {
  return toAccount(await api<ApiAccount>("/auth/email-change/", { method: "DELETE" }));
}

/** The link from the new inbox. Works signed out; resolves to the email now on the account. */
export async function confirmEmailChange(token: string): Promise<string> {
  const res = await api<{ email: string }>("/auth/email-change/confirm/", { method: "POST", body: { token } });
  return res.email;
}

export async function updateMe(
  patch: Partial<{ name: string; email: string; adminLang: Lang | null }>
): Promise<Account> {
  return toAccount(await api<ApiAccount>("/auth/me/", { method: "PATCH", body: patch }));
}

export async function changePassword(current: string, next: string): Promise<void> {
  // The server ends every session and hands this browser a fresh one.
  const res = await api<{ access?: string }>("/auth/password-change/", {
    method: "POST",
    body: { old_password: current, new_password: next },
  });
  if (res?.access) setAccessToken(res.access);
}

/** Always resolves the same way, whether or not the address has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  await api<void>("/auth/password-forgot/", { method: "POST", body: { email } });
}

/** Sets the password from an emailed link; the server signs this browser in. */
export async function resetPassword(token: string, password: string): Promise<{ account: Account; firstTime: boolean }> {
  const res = await api<{ access: string; firstTime: boolean }>("/auth/password-reset/", {
    method: "POST",
    body: { token, password },
  });
  setAccessToken(res.access);
  return { account: await fetchMe(), firstTime: res.firstTime };
}
