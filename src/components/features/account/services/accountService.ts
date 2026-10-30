import { api } from "@/lib/api/client";
import { toAccount } from "@/components/features/auth";
import type { ApiAccount } from "@/components/features/auth";
import type { Account } from "@/types";
import type { Confirmation, MySession } from "../types";

export async function setTwoFactor(enabled: boolean, password: string): Promise<Account> {
  return toAccount(await api<ApiAccount>("/auth/2fa/", { method: "POST", body: { enabled, password } }));
}

export function listMySessions(): Promise<MySession[]> {
  return api<MySession[]>("/auth/sessions/");
}

export function endMySession(id: string): Promise<void> {
  return api<void>(`/auth/sessions/${id}/`, { method: "DELETE" });
}

export function signOutOtherSessions(): Promise<{ signedOut: number }> {
  return api<{ signedOut: number }>("/auth/sessions/sign-out-others/", { method: "POST" });
}

export async function uploadAvatar(file: File): Promise<Account> {
  const body = new FormData();
  body.append("file", file);
  return toAccount(await api<ApiAccount>("/auth/me/avatar/", { method: "POST", body }));
}

export async function removeAvatar(): Promise<Account> {
  return toAccount(await api<ApiAccount>("/auth/me/avatar/", { method: "DELETE" }));
}

export function deleteMyAccount(confirmation: Confirmation): Promise<void> {
  return api<void>("/auth/me/delete/", { method: "POST", body: confirmation });
}
