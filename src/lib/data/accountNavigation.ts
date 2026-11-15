import type { AccountType } from "@/types";

/** Available navigation follows the account and configured build capabilities. */
export function accountNavigation(type: AccountType, apiEnabled: boolean) {
  return [
    { href: "/brands", label: "Brands", arLabel: "العلامات", icon: "shapes" },
    { href: "/people", label: "People", arLabel: "الأشخاص", icon: "users" },
    ...(apiEnabled ? [{ href: "/notifications", label: "Notifications", arLabel: "الإشعارات", icon: "bell" }] : []),
    ...(apiEnabled ? [{ href: "/forms", label: "Questionnaires", arLabel: "الاستبيانات", icon: "clipboard-list" }] : []),
    ...(type !== "company" ? [{ href: "/studio/board", label: "Board", arLabel: "اللوحة", icon: "th-large" }] : []),
  ];
}
