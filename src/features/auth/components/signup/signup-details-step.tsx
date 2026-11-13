"use client";

import { AlertBanner, Button } from "@/components/ui";
import { InputField } from "@/components/ui";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import { API_ENABLED } from "@/lib/api/client";
import type { SignupFormState } from "../../hooks/signup/use-signup-form";
import { PasswordField } from "../shared/password-field";
import { useAuthLang } from "../../hooks/shared/use-auth-lang";

/** Step two: name and email; local-only signup also asks for a password. */
export function SignupDetailsStep({ form }: { form: SignupFormState }) {
  const { lang, c } = useAuthLang();
  const type = form.accountType ? ACCOUNT_TYPES[form.accountType] : null;
  return (
    <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
      {type && (
        <p className="flex items-center justify-between gap-3 px-space-4 text-caption text-text-muted">
          <span className="font-medium text-text">{c.signup.typeLine(lang === "ar" ? type.arLabel : type.label)}</span>
          <Button type="button" variant="link" onClick={form.toType} className="text-caption">
            {c.signup.change}
          </Button>
        </p>
      )}
      <AlertBanner message={form.errors.form} />

      <InputField
        label={c.fields.name}
        type="text"
        dir="auto"
        placeholder={c.fields.namePlaceholder}
        value={form.name}
        onChange={(e) => form.setName(e.target.value)}
        error={form.errors.name}
        autoComplete="name"
        autoFocus
      />

      <InputField
        label={c.fields.email}
        type="email"
        inputMode="email"
        dir="ltr"
        placeholder={c.fields.emailPlaceholder}
        value={form.email}
        onChange={(e) => form.changeEmail(e.target.value)}
        onBlur={form.checkEmailTaken}
        error={form.errors.email}
        hint={c.fields.emailHint}
        autoComplete="email"
      />

      {/* The browser-only build has no inbox, so its password is set here;
          with the backend it comes from the emailed link. */}
      {!API_ENABLED && (
        <>
          <PasswordField
            label={c.fields.password}
            placeholder={c.fields.passwordPlaceholder}
            value={form.password}
            strength
            onChange={(e) => form.setPassword(e.target.value)}
            error={form.errors.password}
            autoComplete="new-password"
          />


        </>
      )}

      <Button type="submit" variant="primary" className="mt-1 w-full" disabled={form.busy}>
        {form.busy ? c.signup.creating : c.signup.submit}
      </Button>

      {/* Said before the button is pressed, not discovered afterwards — and
          only in the browser-only build, where it's true. */}
      {!API_ENABLED && (
        <p className="text-caption text-text-faint">
          {c.signup.localNote}
        </p>
      )}
    </form>
  );
}
