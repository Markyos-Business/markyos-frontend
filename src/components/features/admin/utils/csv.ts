import type { AdminUser } from "../types";

const cell = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  // Quote anything with a comma, quote or line break; a leading = + - @ is
  // escaped so a spreadsheet doesn't run it as a formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

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
  return [head, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}
