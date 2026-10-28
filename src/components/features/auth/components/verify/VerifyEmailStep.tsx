"use client";

import { AlertBanner, Button } from "@/components/ui";
import { OtpField } from "@/components/form";
import { useVerifyEmail } from "../../hooks/useVerifyEmail";
import type { PendingVerification } from "../../types";
import { AuthShell } from "../shared/AuthShell";

type VerifyEmailStepProps = {
  pending: PendingVerification;
  /** Called once the code is accepted and the session is live. */
  onVerified?: () => void;
  /** Back to the form, e.g. to fix a mistyped email. */
  onBack: () => void;
};

/** "Check your email": the 6-digit code that confirms a new account. */
export function VerifyEmailStep({ pending, onVerified, onBack }: VerifyEmailStepProps) {
  const verify = useVerifyEmail(pending, onVerified);
  return (
    <AuthShell
      title="Check your email"
      subtitle="Enter the 6-digit code we sent to confirm it's yours. It works for 5 minutes."
      footer={
        <>
          Wrong address?
          <Button variant="link" onClick={onBack}>
            Go back
          </Button>
        </>
      }
    >
      <form onSubmit={verify.submit} className="flex flex-col gap-4" noValidate>
        <p className="text-caption text-text-muted">
          Sent to <span dir="ltr" className="font-medium text-text">{verify.email}</span>
        </p>
        <AlertBanner message={verify.error} />
        <OtpField label="Verification code" value={verify.code} onChange={verify.setCode} />
        <Button type="submit" variant="primary" className="w-full" disabled={verify.busy}>
          {verify.busy ? "Checking…" : "Confirm email"}
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
