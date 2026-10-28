"use client";

import { Button } from "@/components/ui";
import { useGoogleSignIn } from "../../hooks/useGoogleSignIn";
import type { SignupFormState } from "../../hooks/useSignupForm";
import { AuthShell } from "../shared/AuthShell";
import { GoogleSignupStep } from "../shared/GoogleSignupStep";
import { VerifyEmailStep } from "../verify/VerifyEmailStep";
import { SignupDetailsStep } from "./SignupDetailsStep";
import { SignupTypeStep } from "./SignupTypeStep";

/** Signing up: who the account is for, then the details, then the emailed code. */
export function SignupForm({ form }: { form: SignupFormState }) {
  // The type already picked goes along, so a new Google account is created at
  // once; with none picked yet, Google asks for it next.
  const google = useGoogleSignIn({ accountType: form.accountType });
  if (google.pending) return <GoogleSignupStep google={google} />;
  if (form.pending) return <VerifyEmailStep pending={form.pending} onVerified={form.onVerified} onBack={form.clearPending} />;

  const details = form.step === "details";
  return (
    <AuthShell
      title={details ? "Your details" : "Create an account"}
      subtitle={
        details
          ? "Your name, the email you'll sign in with, and a password."
          : "One account holds every brand you work on, and the client links you send out."
      }
      footer={
        <>
          Already have an account?
          <Button variant="link" href="/login">
            Log in
          </Button>
        </>
      }
    >
      {details ? <SignupDetailsStep form={form} /> : <SignupTypeStep form={form} google={google} />}
    </AuthShell>
  );
}
