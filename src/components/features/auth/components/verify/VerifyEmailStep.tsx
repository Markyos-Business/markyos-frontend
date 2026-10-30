"use client";

import { AlertBanner, Button } from "@/components/ui";
import { OtpField } from "@/components/form";
import { useVerifyEmail } from "../../hooks/verify/useVerifyEmail";
import type { PendingVerification } from "../../types";
import { AuthShell } from "../shared/AuthShell";

type VerifyEmailStepProps = {
  pending: PendingVerification;
  /** Called once the code is accepted and the session is live. */
  onVerified?: () => void;
  /** Back to the form, e.g. to fix a mistyped email. */
  onBack: () => void;
};

// The same step, worded for why the code was sent.
const COPY = {
  register: {
    title: "Check your email",
    subtitle: "Enter the 6-digit code we sent to confirm it's yours. It works for 5 minutes.",
    label: "Verification code",
    submit: "Confirm email",
    back: "Wrong address?",
    backLink: "Go back",
  },
  login: {
    title: "Enter your sign-in code",
    subtitle: "Two-step sign-in is on for this account. Enter the 6-digit code we emailed you. It works for 5 minutes.",
    label: "Sign-in code",
    submit: "Sign in",
    back: "Not your account?",
    backLink: "Use another account",
  },
} as const;

/**
 * "Check your email": the emailed 6-digit code, confirming a new account or,
 * with two-step sign-in, finishing a sign-in.
 */
export function VerifyEmailStep({ pending, onVerified, onBack }: VerifyEmailStepProps) {
  const verify = useVerifyEmail(pending, onVerified);
  const copy = COPY[pending.purpose];
  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          {copy.back}
          <Button variant="link" onClick={onBack}>
            {copy.backLink}
          </Button>
        </>
      }
    >
      <form onSubmit={verify.submit} className="flex flex-col gap-4" noValidate>
        <p className="text-caption text-text-muted">
          Sent to <span dir="ltr" className="font-medium text-text">{verify.email}</span>
        </p>
        <AlertBanner message={verify.error} />
        <OtpField label={copy.label} value={verify.code} onChange={verify.setCode} />
        <Button type="submit" variant="primary" className="w-full" disabled={verify.busy}>
          {verify.busy ? "Checking…" : copy.submit}
        </Button>
        <p className="text-center text-caption text-text-faint">
          Didn&apos;t get it?{" "}
          {verify.wait > 0 ? (
            <span>Send a new code in {verify.wait}s</span>
          ) : (
            <Button type="button" variant="link" onClick={verify.resend} className="text-caption">
              Send a new code
            </Button>
          )}
        </p>
      </form>
    </AuthShell>
  );
}
