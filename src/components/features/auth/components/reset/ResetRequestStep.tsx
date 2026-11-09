"use client";

import { AlertBanner, Button } from "@/components/ui";
import { InputField } from "@/components/form";
import { API_ENABLED } from "@/lib/api/client";
import type { ResetState } from "../../hooks/reset/useResetPassword";
import { AuthShell } from "../shared/AuthShell";
import { useAuthLang } from "../../hooks/shared/useAuthLang";

/** Step one: the email to reset. */
export function ResetRequestStep({ reset }: { reset: ResetState }) {
  const { c } = useAuthLang();
  return (
    <AuthShell
      title={c.reset.requestTitle}
      subtitle={
        API_ENABLED
          ? c.reset.requestSubtitleServer
          : c.reset.requestSubtitleLocal
      }
      footer={
        <>
          {c.reset.remembered}
          <Button variant="link" href="/login">
            {c.reset.backToLogin}
          </Button>
        </>
      }
    >
      <form onSubmit={reset.request} className="flex flex-col gap-4" noValidate>
        <AlertBanner message={reset.errors.form} />
        <InputField
          label={c.fields.email}
          type="email"
          inputMode="email"
          dir="ltr"
          placeholder={c.fields.emailPlaceholder}
          value={reset.email}
          onChange={(e) => reset.setEmail(e.target.value)}
          error={reset.errors.email}
          autoComplete="email"
          autoFocus
        />
        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={reset.busy}>
          {API_ENABLED ? (reset.busy ? c.reset.sending : c.reset.emailLink) : c.reset.getCode}
        </Button>
        {!API_ENABLED && (
          <p className="text-[11.5px] leading-[1.5] text-text-faint">
            {c.reset.localNote}
          </p>
        )}
      </form>
    </AuthShell>
  );
}
