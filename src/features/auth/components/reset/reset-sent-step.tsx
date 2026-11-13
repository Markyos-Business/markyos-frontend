"use client";

import { Button } from "@/components/ui";
import type { ResetState } from "../../hooks/reset/use-reset-password";
import { AuthShell } from "../shared/auth-shell";
import { useAuthLang } from "../../hooks/shared/use-auth-lang";

/** With a server: the link is on its way. */
export function ResetSentStep({ reset }: { reset: ResetState }) {
  const { c } = useAuthLang();
  return (
    <AuthShell
      title={c.reset.sentTitle}
      subtitle={c.reset.sentSubtitle}
      footer={
        <>
          {c.reset.wrong}
          <Button type="button" variant="link" onClick={() => reset.setStep("request")}>
            {c.reset.tryAnother}
          </Button>
        </>
      }
    >
      <Button href="/login" variant="primary" className="w-full">
        {c.reset.backToLogin}
      </Button>
    </AuthShell>
  );
}
