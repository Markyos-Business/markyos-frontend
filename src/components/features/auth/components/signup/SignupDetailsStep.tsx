"use client";

import { AlertBanner, Button } from "@/components/ui";
import { InputField } from "@/components/form";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import { API_ENABLED } from "@/lib/api/client";
import type { SignupFormState } from "../../hooks/signup/useSignupForm";
import { PasswordField } from "../shared/PasswordField";

/** Step two: name, email and a password, twice. */
export function SignupDetailsStep({ form }: { form: SignupFormState }) {
  const type = form.accountType ? ACCOUNT_TYPES[form.accountType] : null;
  return (
    <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
      {type && (
        <p className="flex items-center justify-between gap-3 px-space-4 text-caption text-text-muted">
          <span>
            A <span className="font-medium text-text">{type.label.toLowerCase()}</span> account
          </span>
          <Button type="button" variant="link" onClick={form.toType} className="text-caption">
            Change
          </Button>
        </p>
      )}
      <AlertBanner message={form.errors.form} />

      <InputField
        label="Name"
        type="text"
        dir="auto"
        placeholder="Nadeen Darwish"
        value={form.name}
        onChange={(e) => form.setName(e.target.value)}
        error={form.errors.name}
        autoComplete="name"
        autoFocus
      />

      <InputField
        label="Email"
        type="email"
        inputMode="email"
        dir="ltr"
        placeholder="you@studio.com"
        value={form.email}
        onChange={(e) => form.changeEmail(e.target.value)}
        onBlur={form.checkEmailTaken}
        error={form.errors.email}
        hint="This is what you'll sign in with."
        autoComplete="email"
      />

      {/* The browser-only build has no inbox, so its password is set here;
          with the backend it comes from the emailed link. */}
      {!API_ENABLED && (
        <>
          <PasswordField
            label="Password"
            placeholder="At least 8 characters"
            value={form.password}
            strength
            onChange={(e) => form.setPassword(e.target.value)}
            error={form.errors.password}
            autoComplete="new-password"
          />

          <PasswordField
            label="Confirm password"
            placeholder="Type it again"
            value={form.confirm}
            onChange={(e) => form.setConfirm(e.target.value)}
            error={form.errors.confirm}
            autoComplete="new-password"
          />
        </>
      )}

      <Button type="submit" variant="primary" className="mt-1 w-full" disabled={form.busy}>
        {form.busy ? "Creating…" : "Create account"}
      </Button>

      {/* Said before the button is pressed, not discovered afterwards — and
          only in the browser-only build, where it's true. */}
      {!API_ENABLED && (
        <p className="text-caption text-text-faint">
          This build keeps your account and your brands in this browser. Nothing is sent to a
          server, which also means clearing site data erases them and there is no inbox to recover
          a password from — the reset code appears on screen instead.
        </p>
      )}
    </form>
  );
}
