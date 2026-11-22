import { Suspense } from "react";
import { AdminBillingView } from "@/features/admin";

// The tab, search, filters and page live in the URL's search params.
export default function AdminBillingPage() {
  return (
    <Suspense>
      <AdminBillingView />
    </Suspense>
  );
}
