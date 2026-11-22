import { toCsv } from "@/lib/csv";
import type { AdminUser } from "../types";

/** The users list as CSV, in English column names so it imports anywhere. */
export function usersCsv(users: AdminUser[]): string {
  const head = ["Name", "Email", "Role", "Status", "Account type", "Language", "Joined", "Last signed in", "Brands owned", "Brands on"];
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.role,
    u.status,
    u.accountType,
    u.language,
    u.createdAt,
    u.lastLoginAt,
    u.brandsOwned,
    u.brandsMember,
  ]);
  return toCsv([head, ...rows]);
}
