// Public API of the platform admin feature. Code outside features/admin/
// imports from "@/components/features/admin", never from a file inside it.
export * from "./components";
export type { AdminStats, AdminUser } from "./types";
