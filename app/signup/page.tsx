"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/core/store/store";
import { AlertBanner, Button, useToast } from "@/shared/ui";
import { InputField } from "@/shared/form";
import {
  AuthShell,
  PasswordField,
  SocialSignIn,
  EMAIL_RE,
  normaliseEmail,
  scorePassword,
} from "@/features/auth";

export default function SignupPage() {
  const { signup, state, hydrated } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = useState(false);
  /*
   * Set the instant registration succeeds, and checked by the redirect below.
   *
   * Registering creates the session, which immediately satisfies "already
   * signed in, go to the gallery" — so the effect fired and replaced the
   * push to /brands/new that had just been issued. The result was that
   * finishing registration dropped people on an empty gallery instead of the
   * screen that helps them make their first brand.
   *
   * A ref, not state: it must be true for the effect that runs after this same
   * commit, and a state update wouldn't have landed yet.
   */
  const justRegistered = useRef(false);

  useEffect(() => {
    if (justRegistered.current) return;
    if (hydrated && state.session) router.replace("/brands");
  }, [hydrated, state.session, router]);

  /*
   * The duplicate check runs on blur as well as on submit.
   *
   * Finding out the email is taken only after filling in a password and a
   * confirmation, and then being bounced, is the worst version of this. The
   * store checks again on submit — this one is a courtesy, not the guard.
   */
  function checkEmailTaken() {
    const clean = normaliseEmail(email);
    if (!clean || !EMAIL_RE.test(clean)) return;
    const taken = state.accounts.some((a) => normaliseEmail(a.email) === clean);
    setErrors((e) => ({
      ...e,
      email: taken ? "An account already uses that email." : undefined,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: typeof errors = {};
    if (!name.trim()) field.name = "Tell us your name.";
    if (!EMAIL_RE.test(email.trim())) field.email = "Enter a valid email address.";
    if (password.length < 8) field.password = "At least 8 characters.";
    else if (scorePassword(password).score === 0) {
      field.password = "That one is too easy to guess — try something longer.";
    }
    // Compared rather than assumed. A typo in a password nobody can see is the
    // single most common way someone locks themselves out on the first day.
    if (confirm !== password) field.confirm = "These don't match.";
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    justRegistered.current = true;
    const failed = await signup(name, email, password);
    setBusy(false);
    if (failed) justRegistered.current = false;

    if (failed) {
      // The email clash is the one failure that belongs to a field.
      if (/email/i.test(failed)) setErrors({ email: failed });
      else setErrors({ form: failed });
      return;
    }

    showToast("Account created. Let's set up your first brand.", "success");
    router.push("/brands/new");
  }

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <AlertBanner message={errors.form} />

        <InputField
          label="Name"
          type="text"
          dir="auto"
          placeholder="Nadeen Darwish"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
          autoFocus
        />

        <InputField
          label="Email"
          type="email"
          inputMode="email"
          dir="ltr"
          placeholder="you@studio.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
          }}
          onBlur={checkEmailTaken}
          error={errors.email}
          hint="This is what you'll sign in with."
          autoComplete="email"
        />

        <PasswordField
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          strength
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm password"
          placeholder="Type it again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </Button>

        {/* Said before the button is pressed, not discovered afterwards. */}
        <p className="text-[11.5px] leading-[1.5] text-text-faint">
          This build keeps your account and your brands in this browser. Nothing is sent to a
          server, which also means clearing site data erases them and there is no inbox to recover
          a password from — the reset code appears on screen instead.
        </p>

        <SocialSignIn />
      </form>
    </AuthShell>
  );
}
