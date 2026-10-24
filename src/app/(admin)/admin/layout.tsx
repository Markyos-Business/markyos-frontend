import type { ReactNode } from "react";
import { AdminShell } from "@/components/features/admin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
