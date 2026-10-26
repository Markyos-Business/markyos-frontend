"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { homePath } from "@/lib/data/access";
import { AlertBanner, Button } from "@/components/ui";
import { CheckboxField, InputField } from "@/components/form";
import { AuthShell, PasswordField, SocialSignIn, EMAIL_RE } from "@/components/features/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageBody />
    </Suspense>
  );
}

function LoginPageBody() {
  const { state, hydrated } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");

  // Someone signed in has no business on the login screen; send them where
  // they were going, or to their start page. This is also what moves them on
  // after a successful sign-in: the session lands, the form unmounts, and
  // this runs with the account in hand.
  const home = homePath(account);
  useEffect(() => {
    if (hydrated && state.session) router.replace(next || home);
  }, [hydrated, state.session, router, next, home]);

  // The form is split out so that it mounts only after hydration. That lets it
  // read the lockout straight from `sessionStorage` in a `useState`
  // initialiser: there is no server pass for that first value to disagree
  // with, and no setState-in-effect to cascade a second render.
  if (!hydrated || state.session) return null;
  return <LoginForm />;
}

function LoginForm() {
  const { login } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) field.email = "Enter a valid email address.";
    if (!password) field.password = "Enter your password.";
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    const failed = await login(email, password, remember);
    setBusy(false);

    if (failed) {
      setErrors({ form: failed });
    }
  }

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <AlertBanner
          message={errors.form}
        />

        <InputField
          label="Email"
          type="email"
          inputMode="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <PasswordField
          label="Password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          labelRight={
            <Button
              variant="link"
              href={`/reset${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
              className="text-[12px] font-medium"
            >
              Forgot?
            </Button>
          }
        />

        <CheckboxField label="Stay signed in" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <p className="-mt-2 text-[11.5px] leading-normal text-text-faint">
          {remember
            ? "You'll stay signed in on this browser until you log out."
            : "You'll be signed out when you close this browser."}
        </p>

        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={busy}>
          {busy ? "Checking…" : "Log in"}
        </Button>

        <SocialSignIn />
      </form>

    </AuthShell>
  );
}
