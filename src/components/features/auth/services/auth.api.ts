import { ApiError, api, setAccessToken } from "@/lib/api/client";
import type { Account, AccountRole, AccountType, Lang } from "@/types";

/** The account as the backend sends it (`AccountSerializer`). */
interface ApiAccount {
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
  };
}

export async function signup(
  name: string,
  email: string,
  password: string,
  accountType: AccountType,
  remember = true
): Promise<Account> {
  const res = await api<{ access: string; account: ApiAccount }>("/auth/signup/", {
    method: "POST",
    body: { name, email, password, accountType, remember },
  });
  setAccessToken(res.access);
  return toAccount(res.account);
}

export async function login(email: string, password: string, remember = true): Promise<Account> {
  const res = await api<{ access?: string; requires_otp: boolean }>("/auth/login/", {
    method: "POST",
    body: { email, password, remember },
  });
  if (res.requires_otp || !res.access) {
    // Two-factor accounts are an NGO-era flow the Markyos UI has no screen for.
    throw new ApiError("This account needs a verification code, which this app can't take yet.", 403);
  }
  setAccessToken(res.access);
  return fetchMe();
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

export async function updateMe(
  patch: Partial<{ name: string; email: string; adminLang: Lang | null }>
): Promise<Account> {
  return toAccount(await api<ApiAccount>("/auth/me/", { method: "PATCH", body: patch }));
}

export async function changePassword(current: string, next: string): Promise<void> {
  await api<void>("/auth/password-change/", {
    method: "POST",
    body: { old_password: current, new_password: next },
  });
}

/** Always resolves the same way, whether or not the address has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  await api<void>("/auth/password-forgot/", { method: "POST", body: { email } });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api<void>("/auth/password-reset/", { method: "POST", body: { token, password } });
}
