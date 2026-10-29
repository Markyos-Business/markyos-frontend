import { Suspense } from "react";
import { AdminUsersView } from "@/components/features/admin";

// The list keeps its filters in the URL's search params.
export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersView />
    </Suspense>
  );
}
