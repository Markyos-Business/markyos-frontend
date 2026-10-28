"use client";

import Link from "next/link";
import { AlertBanner, Button, Icon } from "@/components/ui";
import { InputField } from "@/components/form";
import { API_ENABLED } from "@/lib/api/client";
import type { ResetState } from "../../hooks/useResetPassword";
import { AuthShell } from "../shared/AuthShell";
import { PasswordField } from "../shared/PasswordField";

/** Step two: the code (browser-only build) and the new password. */
export function ResetConfirmStep({ reset }: { reset: ResetState }) {
  return (
    <AuthShell
      title={reset.setup ? "Set your password" : "Choose a new password"}
      subtitle={
        reset.setup
          ? "The last step: choose the password you'll sign in with."
          : API_ENABLED
          ? "Choose the password you'll sign in with from now on."
          : reset.issued
            ? "Here's your code. Enter it below along with the password you want."
            : "Enter the code you were given, along with the password you want."
      }
      footer={
        <>
          <Button type="button" variant="link" onClick={reset.startOver}>
            Use a different email
          </Button>
        </>
      }
    >
      <form onSubmit={reset.confirmReset} className="flex flex-col gap-4" noValidate>
        <AlertBanner message={reset.errors.form ?? (API_ENABLED ? reset.errors.token : undefined)} />

        {API_ENABLED ? null : reset.issued ? (
          <div className="flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-3.5">
            <Icon name="key" size={15} className="shrink-0 text-accent-text" />
            <span dir="ltr" className="flex-1 font-mono text-[17px] font-semibold tracking-[0.12em]">
              {reset.issued}
            </span>
            <span className="shrink-0 text-[11px] text-text-faint">30 min</span>
          </div>
        ) : (
          /* No code was issued, because no account matched — said this way
             rather than naming the address (see useResetPassword). */
          <p className="rounded-lg bg-surface-2 px-4 py-3.5 text-[12.5px] leading-[1.5] text-text-muted">
            If an account exists for that email, its code is shown here. Nothing appeared, so check
            the address — or{" "}
            <Link href="/signup" className="text-accent-text">
              create an account
            </Link>
            .
          </p>
        )}

        {!API_ENABLED && (
          <InputField
            label="Reset code"
            dir="ltr"
            placeholder="ABCD1234EFGH"
            value={reset.token}
            onChange={(e) => reset.setToken(e.target.value.toUpperCase())}
            error={reset.errors.token}
            autoComplete="one-time-code"
          />
        )}

        <PasswordField
          label="New password"
          placeholder="At least 8 characters"
          value={reset.password}
          strength
          onChange={(e) => reset.setPassword(e.target.value)}
          error={reset.errors.password}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm new password"
          placeholder="Type it again"
          value={reset.confirm}
          onChange={(e) => reset.setConfirm(e.target.value)}
          error={reset.errors.confirm}
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={reset.busy}>
          {reset.busy ? "Saving…" : reset.setup ? "Set password and continue" : "Set new password"}
        </Button>
        <p className="text-[11.5px] leading-[1.5] text-text-faint">
          You&apos;ll be asked to sign in with the new password — changing it doesn&apos;t sign you
          in by itself.
        </p>
      </form>
    </AuthShell>
  );
}
