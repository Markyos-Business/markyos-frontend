import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/features/admin";

// The CMS menu reads its section from the address (?kind=), so the shell waits for it.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
