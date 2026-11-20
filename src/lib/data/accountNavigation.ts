import type { AccountType } from "@/types";
import { accountCapabilities } from "./accountExperience";

/**
 * Available navigation follows the account and configured build capabilities.
 * A reviewer (client on every brand they're on) gets their brands and
 * notifications: People, Questionnaires and Board are the studio's tools.
 */
export function accountNavigation(type: AccountType, apiEnabled: boolean, reviewer = false) {
  if (reviewer) {
    return [
      { href: "/brands", label: "Brands", arLabel: "العلامات", icon: "shapes" },
      ...(apiEnabled ? [{ href: "/notifications", label: "Notifications", arLabel: "الإشعارات", icon: "bell" }] : []),
    ];
  }
  return [
    { href: "/brands", label: "Brands", arLabel: "العلامات", icon: "shapes" },
    { href: "/people", label: "People", arLabel: "الأشخاص", icon: "users" },
    ...(apiEnabled ? [{ href: "/notifications", label: "Notifications", arLabel: "الإشعارات", icon: "bell" }] : []),
    ...(apiEnabled ? [{ href: "/forms", label: "Questionnaires", arLabel: "الاستبيانات", icon: "clipboard-list" }] : []),
    ...(accountCapabilities(type).board ? [{ href: "/studio/board", label: "Board", arLabel: "اللوحة", icon: "th-large" }] : []),
  ];
}
