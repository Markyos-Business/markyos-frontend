"use client";

import { Suspense } from "react";
import { AccountView } from "@/components/features/account";

/*
 * The Suspense boundary is required, not decorative: the view reads `?tab=`,
 * and `useSearchParams` in a prerendered client component fails the build
 * without one. The fallback is null because the view renders nothing until the
 * store hydrates anyway.
 */
export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountView />
    </Suspense>
  );
}
