"use client";

import { Suspense } from "react";
import { LoginView } from "@/components/features/auth";

// Suspense, because the view reads the `next` search param.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
