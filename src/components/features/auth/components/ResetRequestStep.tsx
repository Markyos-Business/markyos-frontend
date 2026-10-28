"use client";

import { AlertBanner, Button } from "@/components/ui";
import { InputField } from "@/components/form";
import { API_ENABLED } from "@/lib/api/client";
import type { ResetState } from "../hooks/useResetPassword";
import { AuthShell } from "./AuthShell";

/** Step one: the email to reset. */
export function ResetRequestStep({ reset }: { reset: ResetState }) {
  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        API_ENABLED
          ? "We'll email a link to reset the password for the account on this email."
          : "We'll generate a one-time code for the account on this email."
      }
      footer={
        <>
          Remembered it?
          <Button variant="link" href="/login">
            Back to log in
          </Button>
        </>
      }
    >
      <form onSubmit={reset.request} className="flex flex-col gap-4" noValidate>
        <AlertBanner message={reset.errors.form} />
        <InputField
          label="Email"
          type="email"
          inputMode="email"
          dir="ltr"
          placeholder="you@studio.com"
          value={reset.email}
          onChange={(e) => reset.setEmail(e.target.value)}
          error={reset.errors.email}
          autoComplete="email"
          autoFocus
        />
        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={reset.busy}>
          {API_ENABLED ? (reset.busy ? "Sending…" : "Email me a reset link") : "Get a reset code"}
        </Button>
        {!API_ENABLED && (
          <p className="text-[11.5px] leading-[1.5] text-text-faint">
            There is no mail server in this build, so the code appears on the next screen instead
            of arriving by email. It is good for 30 minutes and works once.
          </p>
        )}
      </form>
    </AuthShell>
  );
}
