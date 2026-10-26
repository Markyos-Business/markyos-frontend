"use client";

import { Suspense } from "react";
import { ResetView } from "@/components/features/auth";

// Suspense, because the view reads the `token` and `email` search params.
export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetView />
    </Suspense>
  );
}
