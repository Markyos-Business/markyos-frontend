"use client";

import { Button } from "@/components/ui";
import { useGoogleSignIn } from "../../hooks/shared/useGoogleSignIn";
import type { SignupFormState } from "../../hooks/signup/useSignupForm";
import { AuthShell } from "../shared/AuthShell";
import { GoogleSignupStep } from "../shared/GoogleSignupStep";
import { API_ENABLED } from "@/lib/api/client";
import { SignupDetailsStep } from "./SignupDetailsStep";
import { SignupEmailSentStep } from "./SignupEmailSentStep";
import { SignupTypeStep } from "./SignupTypeStep";
import { useAuthLang } from "../../hooks/shared/useAuthLang";

/** Signing up: who the account is for, then the details, then the emailed "set your password" link. */
export function SignupForm({ form }: { form: SignupFormState }) {
  // The type already picked goes along, so a new Google account is created at
  // once; with none picked yet, Google asks for it next.
  const google = useGoogleSignIn({ accountType: form.accountType });
  const { c } = useAuthLang();
  if (google.pending) return <GoogleSignupStep google={google} />;
  if (form.setup) return <SignupEmailSentStep setup={form.setup} onBack={form.clearSetup} />;

  const details = form.step === "details";
  return (
    <AuthShell
      title={details ? c.signup.detailsTitle : c.signup.createTitle}
      subtitle={
        details
          ? API_ENABLED
            ? c.signup.detailsSubtitleServer
            : c.signup.detailsSubtitleLocal
          : c.signup.createSubtitle
      }
      footer={
        <>
          {c.signup.haveAccount}
          <Button variant="link" href="/login">
            {c.signup.login}
          </Button>
        </>
      }
    >
      {details ? <SignupDetailsStep form={form} /> : <SignupTypeStep form={form} google={google} />}
    </AuthShell>
  );
}
