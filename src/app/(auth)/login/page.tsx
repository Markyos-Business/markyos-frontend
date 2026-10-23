"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/contexts/AppContext";
import { AlertBanner, Button } from "@/components/ui";
import { CheckboxField, InputField } from "@/components/form";
import { AuthShell, PasswordField, SocialSignIn, EMAIL_RE } from "@/components/features/auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/data/mockData";

/*
 * Attempt limiting.
 *
 * Client-side, so it stops a person at a keyboard rather than a script — which
 * is the realistic threat against a guideline tool, and the same bar the client
 * password gate already holds. It is not a claim to have stopped an attacker
 * with devtools, and nothing in the copy pretends otherwise.
 *
 * `sessionStorage`, matching the client gate: a lockout that survives closing
 * the browser punishes the person who simply forgot, and one that resets on
 * every reload stops nobody.
 */
const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;
const LOCK_KEY = "markyos:login-lock";

/*
 * The count is stored, not just the lock.
 *
 * It was React state to begin with, which meant it reset on every page load —
 * so five tries became five tries *per visit*, and reloading between guesses
 * walked straight past the limit. A counter that a refresh clears is not a
 * counter.
 */
interface Attempts {
  tries: number;
  until: number;
}

const readAttempts = (): Attempts => {
  try {
    const raw = window.sessionStorage.getItem(LOCK_KEY);
    if (!raw) return { tries: 0, until: 0 };
    const parsed = JSON.parse(raw) as Partial<Attempts>;
    const until = Number(parsed.until) || 0;
    // An expired lock takes the count with it: the pause is the punishment,
    // and serving it earns a clean slate.
    if (until && until <= Date.now()) return { tries: 0, until: 0 };
    return { tries: Number(parsed.tries) || 0, until };
  } catch {
    return { tries: 0, until: 0 };
  }
};

const writeAttempts = (a: Attempts) => {
  try {
    if (!a.tries && !a.until) window.sessionStorage.removeItem(LOCK_KEY);
    else window.sessionStorage.setItem(LOCK_KEY, JSON.stringify(a));
  } catch {
    /* storage blocked — the limit just won't survive this page */
  }
};

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
  const [attempts, setAttempts] = useState<Attempts>(() => readAttempts());
  const [now, setNow] = useState(() => Date.now());

  const lockUntil = attempts.until;
  const locked = lockUntil > now;
  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [locked]);

  const remaining = Math.max(0, lockUntil - now);
  const countdown = `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || locked) return;

    const field: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) field.email = "Enter a valid email address.";
    if (!password) field.password = "Enter your password.";
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    const failed = await login(email, password, remember);
    setBusy(false);

    if (failed) {
      const used = attempts.tries + 1;
      const updated: Attempts =
        used >= MAX_TRIES ? { tries: used, until: Date.now() + LOCK_MS } : { tries: used, until: 0 };
      writeAttempts(updated);
      setAttempts(updated);
      setNow(Date.now());
      if (updated.until) {
        setErrors({});
        return;
      }
      const left = MAX_TRIES - used;
      setErrors({
        form: `${failed} ${left} ${left === 1 ? "try" : "tries"} left before this form pauses for a few minutes.`,
      });
      return;
    }

    // A clean sign-in clears the count — the limit is there for a run of
    // failures, not as a running tally against the person.
    writeAttempts({ tries: 0, until: 0 });
    setAttempts({ tries: 0, until: 0 });
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
          message={
            locked ? (
              <>
                Too many attempts. This form unlocks on its own in {countdown}. If you&apos;ve forgotten
                the password, you can reset it now instead of waiting.
              </>
            ) : (
              errors.form
            )
          }
        />

        <InputField
          label="Email"
          type="email"
          inputMode="email"
          placeholder="you@studio.com"
          value={email}
          disabled={locked}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <PasswordField
          label="Password"
          placeholder="••••••••••"
          value={password}
          disabled={locked}
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

        <Button type="submit" variant="primary" className="mt-1 w-full" disabled={busy || locked}>
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
            disabled={locked || busy}
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
