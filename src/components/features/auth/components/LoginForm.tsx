"use client";

import { AlertBanner, Button } from "@/components/ui";
import { CheckboxField, InputField } from "@/components/form";
import { useLoginForm } from "../hooks/useLoginForm";
import { AuthShell } from "./AuthShell";
import { PasswordField } from "./PasswordField";
import { SocialSignIn } from "./SocialSignIn";

/** Email, password, stay signed in, and the way to sign up or reset. */
export function LoginForm() {
  const form = useLoginForm();

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

        <SocialSignIn />
      </form>
    </AuthShell>
  );
}
