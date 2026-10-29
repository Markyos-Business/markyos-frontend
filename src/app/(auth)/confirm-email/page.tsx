"use client";

import { Suspense } from "react";
import { ConfirmEmailView } from "@/components/features/auth";

// Suspense, because the view reads the `token` search param.
export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailView />
    </Suspense>
  );
}
