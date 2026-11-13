// Public API of the platform admin feature. Code outside features/admin/
// imports from "./", never from a file inside it.

// Screens: what the (admin) pages render.
export { AdminDashboardView } from "./components/dashboard/admin-dashboard-view";
export { AdminUsersView } from "./components/users/admin-users-view";
export { AdminUserView } from "./components/user-detail/admin-user-view";

// The admin area's layout: sidebar, top bar, and the members-out guard.
export { AdminShell } from "./components/shared/admin-shell";

export type { AdminStats, AdminUser } from "./types";
