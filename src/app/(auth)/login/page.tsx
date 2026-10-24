"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/contexts/AppContext";
import { AlertBanner, Button } from "@/components/ui";
import { CheckboxField, InputField } from "@/components/form";
import { AuthShell, PasswordField, SocialSignIn, EMAIL_RE } from "@/components/features/auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/data/mockData";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageBody />
    </Suspense>
  );
}

function LoginPageBody() {
  const { state, hydrated } = useApp();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");

  // Someone already signed in has no business on the login screen; send them
  // where they were going.
  useEffect(() => {
    if (hydrated && state.session) router.replace(next || "/brands");
  }, [hydrated, state.session, router, next]);

  // The form is split out so that it mounts only after hydration. That lets it
  // read the lockout straight from `sessionStorage` in a `useState`
  // initialiser: there is no server pass for that first value to disagree
  // with, and no setState-in-effect to cascade a second render.
  if (!hydrated || state.session) return null;
  return <LoginForm next={next} />;
}

function LoginForm({ next }: { next: string | null }) {
  const { login, state } = useApp();
  const router = useRouter();

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
      return;
    }
    router.push(next || "/brands");
  }

  // Only offered while the seeded account still has its seeded password. Once
  // someone changes it this disappears rather than printing a password that no
  // longer works.
  const demo = state.accounts.find((a) => a.email === DEMO_EMAIL);
  const showDemo = !!demo && demo.password === `plain$${DEMO_PASSWORD}`;

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
        <p className="-mt-2 text-[11.5px] leading-[1.5] text-text-faint">
          {remember
            ? "You'll stay signed in on this browser until you log out."
            : "You'll be signed out when you close this browser."}
        </p>

        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={busy}>
          {busy ? "Checking…" : "Log in"}
        </Button>

        <SocialSignIn />
      </form>

      {showDemo && (
        // Seed data, in a public repo, printed here on purpose: the demo brands
        // belong to a real account now, and there is no other way in.
        <div className="flex flex-col gap-2 rounded-[10px] bg-surface-2 px-3.5 py-3 text-[12px] text-text-muted">
          <span className="font-semibold text-text-secondary">Want to look around first?</span>
          <span className="leading-[1.5]">
            The sample studio and its five brands live on a demo account —{" "}
            <span dir="ltr" className="font-mono">{DEMO_EMAIL}</span> /{" "}
            <span dir="ltr" className="font-mono">{DEMO_PASSWORD}</span>.
          </span>
          <Button
            type="button"
            variant="link"
            disabled={busy}
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setErrors({});
            }}
            className="self-start text-[12px] font-semibold"
          >
            Fill it in for me
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
