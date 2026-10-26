"use client";

import { SignupForm, useSignupForm } from "@/components/features/auth";

export default function SignupPage() {
  const form = useSignupForm();
  return <SignupForm form={form} />;
}
