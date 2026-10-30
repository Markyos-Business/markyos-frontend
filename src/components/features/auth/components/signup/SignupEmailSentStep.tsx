"use client";

import { AlertBanner, Button } from "@/components/ui";
import { useSetupEmail } from "../../hooks/signup/useSetupEmail";
import type { PasswordSetup } from "../../types";
import { AuthShell } from "../shared/AuthShell";

type SignupEmailSentStepProps = {
  setup: PasswordSetup;
  /** Back to the details, e.g. to fix a mistyped email. */
  onBack: () => void;
};

/** After sign-up: the "set your password" link is in their inbox. */
export function SignupEmailSentStep({ setup, onBack }: SignupEmailSentStepProps) {
  const mail = useSetupEmail(setup);
  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent a link to set your password. Open it to finish creating your account — it works for 60 minutes."
      footer={
        <>
          Wrong address?
          <Button variant="link" onClick={onBack}>
            Go back
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-caption text-text-muted">
          Sent to <span dir="ltr" className="font-medium text-text">{mail.email}</span>
        </p>
        <AlertBanner message={mail.error} />
        <p className="text-center text-caption text-text-faint">
          Didn&apos;t get it? Check your spam folder, or{" "}
          {mail.wait > 0 ? (
            <span>send it again in {mail.wait}s</span>
          ) : (
            <Button type="button" variant="link" onClick={mail.resend} disabled={mail.busy} className="text-caption">
              send it again
            </Button>
          )}
        </p>
      </div>
    </AuthShell>
  );
}
