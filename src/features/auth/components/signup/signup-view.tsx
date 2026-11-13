"use client";

import { useSignupForm } from "../../hooks/signup/use-signup-form";
import { SignupForm } from "./signup-form";

/** Creating an account. */
export function SignupView() {
  const form = useSignupForm();
  return <SignupForm form={form} />;
}
