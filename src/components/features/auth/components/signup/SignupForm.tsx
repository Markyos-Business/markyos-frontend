"use client";

import { AlertBanner, Button } from "@/components/ui";
import { InputField, RadioCardGroup } from "@/components/form";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import { API_ENABLED } from "@/lib/api/client";
import type { SignupFormState } from "../../hooks/useSignupForm";
import { AuthShell } from "../shared/AuthShell";
import { PasswordField } from "../shared/PasswordField";
import { SocialSignIn } from "../shared/SocialSignIn";

/** Who the account is for, then name, email and a password, twice. */
export function SignupForm({ form }: { form: SignupFormState }) {

  return (
    <AuthShell
      title="Create an account"
      subtitle="One account holds every brand you work on, and the client links you send out."
      footer={
        <>
          Already have an account?
          <Button variant="link" href="/login">
            Log in
          </Button>
        </>
      }
    >
      <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
        <AlertBanner message={form.errors.form} />

        <div className="flex flex-col gap-space-2">
          <span className="text-caption text-text-muted">Who is this account for?</span>
          <RadioCardGroup
            label="Who is this account for?"
            columns={1}
            options={ACCOUNT_TYPE_KEYS.map((key) => ({
              value: key,
              label: ACCOUNT_TYPES[key].label,
              hint: ACCOUNT_TYPES[key].description,
              icon: ACCOUNT_TYPES[key].icon,
            }))}
            value={form.accountType}
            onChange={form.chooseAccountType}
            error={form.errors.accountType}
          />
        </div>

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

        <SocialSignIn />
      </form>
    </AuthShell>
  );
}
