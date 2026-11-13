"use client";

import Link from "next/link";
import { AlertBanner, Button, Icon } from "@/components/ui";
import { InputField } from "@/components/ui";
import { API_ENABLED } from "@/lib/api/client";
import type { ResetState } from "../../hooks/reset/use-reset-password";
import { AuthShell } from "../shared/auth-shell";
import { PasswordField } from "../shared/password-field";
import { useAuthLang } from "../../hooks/shared/use-auth-lang";

/** Step two: the code (browser-only build) and the new password. */
export function ResetConfirmStep({ reset }: { reset: ResetState }) {
  const { c } = useAuthLang();
  return (
    <AuthShell
      title={reset.setup ? c.reset.setTitle : c.reset.chooseTitle}
      subtitle={
        reset.invited
          ? c.reset.invitedSubtitle
          : reset.setup
          ? c.reset.setupSubtitle
          : API_ENABLED
          ? c.reset.serverSubtitle
          : reset.issued
            ? c.reset.issuedSubtitle
            : c.reset.enterSubtitle
      }
      footer={
        <>
          <Button type="button" variant="link" onClick={reset.startOver}>
            {c.reset.differentEmail}
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
            <span className="shrink-0 text-[11px] text-text-faint">{c.reset.minutes}</span>
          </div>
        ) : (
          /* No code was issued, because no account matched — said this way
             rather than naming the address (see useResetPassword). */
          <p className="rounded-lg bg-surface-2 px-4 py-3.5 text-[12.5px] leading-[1.5] text-text-muted">
            {c.reset.noCode}{" "}
            <Link href="/signup" className="text-accent-text">
              {c.reset.createAccount}
            </Link>
            .
          </p>
        )}

        {!API_ENABLED && (
          <InputField
            label={c.fields.resetCode}
            dir="ltr"
            placeholder="ABCD1234EFGH"
            value={reset.token}
            onChange={(e) => reset.setToken(e.target.value.toUpperCase())}
            error={reset.errors.token}
            autoComplete="one-time-code"
          />
        )}

        <PasswordField
          label={c.fields.newPassword}
          placeholder={c.fields.passwordPlaceholder}
          value={reset.password}
          strength
          onChange={(e) => reset.setPassword(e.target.value)}
          error={reset.errors.password}
          autoComplete="new-password"
        />

        <PasswordField
          label={c.fields.confirmNewPassword}
          placeholder={c.fields.confirmPlaceholder}
          value={reset.confirm}
          onChange={(e) => reset.setConfirm(e.target.value)}
          error={reset.errors.confirm}
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={reset.busy}>
          {reset.busy ? c.reset.saving : reset.invited ? c.reset.openBrand : reset.setup ? c.reset.continue : c.reset.setNew}
        </Button>
        <p className="text-[11.5px] leading-[1.5] text-text-faint">
          {c.reset.afterNote}
        </p>
      </form>
    </AuthShell>
  );
}
