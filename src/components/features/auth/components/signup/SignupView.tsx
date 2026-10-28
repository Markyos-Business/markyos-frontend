"use client";

import { useSignupForm } from "../../hooks/useSignupForm";
import { SignupForm } from "./SignupForm";

/** Creating an account. */
export function SignupView() {
  const form = useSignupForm();
  return <SignupForm form={form} />;
}
