"use client";

import { AlertBanner, Button } from "@/components/ui";
import { useSetupEmail } from "../../hooks/signup/useSetupEmail";
import type { PasswordSetup } from "../../types";
import { AuthShell } from "../shared/AuthShell";
import { useAuthLang } from "../../hooks/shared/useAuthLang";

type SignupEmailSentStepProps = {
  setup: PasswordSetup;
  /** Back to the details, e.g. to fix a mistyped email. */
  onBack: () => void;
};

/** After sign-up: the "set your password" link is in their inbox. */
export function SignupEmailSentStep({ setup, onBack }: SignupEmailSentStepProps) {
  const mail = useSetupEmail(setup);
  const { c } = useAuthLang();
  return (
    <AuthShell
      title={c.sent.title}
      subtitle={c.sent.subtitle}
      footer={
        <>
          {c.sent.wrong}
          <Button variant="link" onClick={onBack}>
            {c.sent.goBack}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-caption text-text-muted">
          {c.sent.sentTo} <span dir="ltr" className="font-medium text-text">{mail.email}</span>
        </p>
        <AlertBanner message={mail.error} />
        <p className="text-center text-caption text-text-faint">
          {c.sent.didntGet}{" "}
          {mail.wait > 0 ? (
            <span>{c.sent.sendAgainIn(mail.wait)}</span>
          ) : (
            <Button type="button" variant="link" onClick={mail.resend} disabled={mail.busy} className="text-caption">
              {c.sent.sendAgain}
            </Button>
          )}
        </p>
      </div>
    </AuthShell>
  );
}
