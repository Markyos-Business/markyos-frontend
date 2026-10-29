// Public API of the platform admin feature. Code outside features/admin/
// imports from "@/components/features/admin", never from a file inside it.

// Screens: what the (admin) pages render.
export { AdminDashboardView } from "./components/dashboard/AdminDashboardView";
export { AdminUsersView } from "./components/users/AdminUsersView";
export { AdminUserView } from "./components/user-detail/AdminUserView";

// The admin area's layout: sidebar, top bar, and the members-out guard.
export { AdminShell } from "./components/shared/AdminShell";

export type { AdminStats, AdminUser } from "./types";
