"use client";

import { Suspense } from "react";
import { SignupView } from "@/components/features/auth";

export default function SignupPage() {
  // Suspense: the form reads ?type= from the address, which is only known in the browser.
  return (
    <Suspense>
      <SignupView />
    </Suspense>
  );
}
