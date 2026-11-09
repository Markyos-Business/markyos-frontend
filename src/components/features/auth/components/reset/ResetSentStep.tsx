"use client";

import { Button } from "@/components/ui";
import type { ResetState } from "../../hooks/reset/useResetPassword";
import { AuthShell } from "../shared/AuthShell";
import { useAuthLang } from "../../hooks/shared/useAuthLang";

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
