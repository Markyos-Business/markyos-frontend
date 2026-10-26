"use client";

import { Button } from "@/components/ui";
import type { ResetState } from "../hooks/useResetPassword";
import { AuthShell } from "./AuthShell";

/** With a server: the link is on its way. */
export function ResetSentStep({ reset }: { reset: ResetState }) {
  return (
    <AuthShell
      title="Check your inbox"
      subtitle="If an account exists for that email, a link to reset its password is on its way. It works once, for 60 minutes."
      footer={
        <>
          Wrong address?
          <Button type="button" variant="link" onClick={() => reset.setStep("request")}>
            Try another email
          </Button>
        </>
      }
    >
      <Button href="/login" variant="primary" className="w-full">
        Back to log in
      </Button>
    </AuthShell>
  );
}
