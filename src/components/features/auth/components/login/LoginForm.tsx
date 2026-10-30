"use client";

import { AlertBanner, Button } from "@/components/ui";
import { CheckboxField, InputField } from "@/components/form";
import { useGoogleSignIn } from "../../hooks/shared/useGoogleSignIn";
import { useLoginForm } from "../../hooks/login/useLoginForm";
import { AuthShell } from "../shared/AuthShell";
import { GoogleSignupStep } from "../shared/GoogleSignupStep";
import { PasswordField } from "../shared/PasswordField";
import { SocialSignIn } from "../shared/SocialSignIn";
import { VerifyEmailStep } from "../verify/VerifyEmailStep";

/** Email, password, stay signed in, and the way to sign up or reset. */
export function LoginForm() {
  const form = useLoginForm();
  const google = useGoogleSignIn({ remember: form.remember });

  // Someone new came through Google: finish their account instead.
  if (google.pending) return <GoogleSignupStep google={google} />;
  // The password was right but the email was never confirmed. Once the code
  // is in, the session lands and the login view moves on by itself.
  if (form.pending) return <VerifyEmailStep pending={form.pending} onBack={form.clearPending} />;

  return (
    <AuthShell
      title="Log in"
      subtitle="Your brands, your guidelines, and anything shared with you."
      footer={
        <>
          New here?
          <Button variant="link" href="/signup">
            Create an account
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SocialSignIn google={google} />
        <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
          <AlertBanner message={form.errors.form} />

          <InputField
            label="Email"
            type="email"
            inputMode="email"
            placeholder="you@studio.com"
            value={form.email}
            onChange={(e) => form.setEmail(e.target.value)}
            error={form.errors.email}
            autoComplete="email"
            autoFocus
          />

          <PasswordField
            label="Password"
            placeholder="••••••••••"
            value={form.password}
            onChange={(e) => form.setPassword(e.target.value)}
            error={form.errors.password}
            autoComplete="current-password"
            labelRight={
              <Button variant="link" href={form.resetHref} className="text-[12px] font-medium">
                Forgot?
              </Button>
            }
          />

          <CheckboxField label="Stay signed in" checked={form.remember} onChange={(e) => form.setRemember(e.target.checked)} />
          <p className="-mt-2 text-[11.5px] leading-normal text-text-faint">
            {form.remember ? "You'll stay signed in on this browser until you log out." : "You'll be signed out when you close this browser."}
          </p>

          <Button type="submit" variant="primary" className="mt-1 w-full" disabled={form.busy}>
            {form.busy ? "Checking…" : "Log in"}
          </Button>

        </form>
      </div>
    </AuthShell>
  );
}
