"use client";

import { AlertBanner, Button } from "@/components/ui";
import { OtpField } from "@/components/form";
import { useVerifyEmail } from "../../hooks/verify/useVerifyEmail";
import type { PendingVerification } from "../../types";
import { AuthShell } from "../shared/AuthShell";
import { useAuthLang } from "../../hooks/shared/useAuthLang";

type VerifyEmailStepProps = {
  pending: PendingVerification;
  /** Called once the code is accepted and the session is live. */
  onVerified?: () => void;
  /** Back to the form, e.g. to fix a mistyped email. */
  onBack: () => void;
};


/**
 * "Check your email": the emailed 6-digit code, confirming a new account or,
 * with two-step sign-in, finishing a sign-in.
 */
export function VerifyEmailStep({ pending, onVerified, onBack }: VerifyEmailStepProps) {
  const verify = useVerifyEmail(pending, onVerified);
  const { c } = useAuthLang();
  const copy = c.verify[pending.purpose];
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
          {c.verify.sentTo} <span dir="ltr" className="font-medium text-text">{verify.email}</span>
        </p>
        <AlertBanner message={verify.error} />
        <OtpField label={copy.label} value={verify.code} onChange={verify.setCode} />
        <Button type="submit" variant="primary" className="w-full" disabled={verify.busy}>
          {verify.busy ? c.verify.checking : copy.submit}
        </Button>
        <p className="text-center text-caption text-text-faint">
          {c.verify.didntGet}{" "}
          {verify.wait > 0 ? (
            <span>{c.verify.newCodeIn(verify.wait)}</span>
          ) : (
            <Button type="button" variant="link" onClick={verify.resend} className="text-caption">
              {c.verify.newCode}
            </Button>
          )}
        </p>
      </form>
    </AuthShell>
  );
}
