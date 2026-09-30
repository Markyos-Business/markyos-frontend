"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { TextField } from "@/components/TextField";
import { PillButton } from "@/components/PillButton";
import { Icon } from "@/components/Icon";
import { AuthShell, FormError } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { EMAIL_RE, scorePassword } from "@/lib/auth";

/**
 * Resetting a forgotten password.
 *
 * "Forgot?" used to show a toast saying the feature wasn't wired up, which
 * meant an account whose password was lost was an account that was gone, along
 * with every brand in it. Now it is a working two-step reset.
 *
 * The honest part is step one. A real product emails a link and tells you
 * nothing about whether the address is registered. There is no mail server in
 * this build, so the code is shown on screen — and the screen says that is what
 * is happening, rather than staging a "check your inbox" for a message that
 * will never arrive.
 */
export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetPageBody />
    </Suspense>
  );
}

type Step = "request" | "confirm";

function ResetPageBody() {
  const { requestPasswordReset, resetPassword } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const search = useSearchParams();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [issued, setIssued] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    token?: string;
    password?: string;
    confirm?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  function handleRequest(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    const code = requestPasswordReset(email);
    /*
     * The same screen either way.
     *
     * `requestPasswordReset` returns null for an address with no account, and
     * this deliberately does not say so. A reset form that answers "no account
     * with that email" is a way to find out which of someone's addresses are
     * registered here, one guess at a time.
     *
     * So the step always advances. Someone who typed an address that isn't
     * registered gets a code box and no code, which reads as "I must have used
     * the other email" — which is the truth.
     */
    setIssued(code);
    setToken(code ?? "");
    setStep("confirm");
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const field: typeof errors = {};
    if (!token.trim()) field.token = "Enter the code.";
    if (password.length < 8) field.password = "At least 8 characters.";
    else if (scorePassword(password).score === 0) {
      field.password = "That one is too easy to guess — try something longer.";
    }
    if (confirm !== password) field.confirm = "These don't match.";
    setErrors(field);
    if (Object.keys(field).length > 0) return;

    setBusy(true);
    const failed = await resetPassword(token, password);
    setBusy(false);

    if (failed) {
      if (/code/i.test(failed)) setErrors({ token: failed });
      else setErrors({ form: failed });
      return;
    }

    showToast("Password changed. Sign in with the new one.", "success");
    router.push("/login");
  }

  if (step === "request") {
    return (
      <AuthShell
        title="Reset your password"
        subtitle="We'll generate a one-time code for the account on this email."
        footer={
          <>
            Remembered it?
            <Link href="/login" className="mk-tap" style={{ color: "var(--accent-text)" }}>
              Back to log in
            </Link>
          </>
        }
      >
        <form onSubmit={handleRequest} className="flex flex-col gap-4" noValidate>
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            dir="ltr"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
          <PillButton type="submit" variant="primary" className="w-full mt-1">
            Get a reset code
          </PillButton>
          <p className="text-[11.5px] leading-[1.5]" style={{ color: "var(--text-faint)" }}>
            There is no mail server in this build, so the code appears on the next screen instead of
            arriving by email. It is good for 30 minutes and works once.
          </p>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={
        issued
          ? "Here's your code. Enter it below along with the password you want."
          : "Enter the code you were given, along with the password you want."
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setErrors({});
            }}
            className="mk-tap cursor-pointer"
            style={{ color: "var(--accent-text)" }}
          >
            Use a different email
          </button>
        </>
      }
    >
      <form onSubmit={handleConfirm} className="flex flex-col gap-4" noValidate>
        <FormError>{errors.form}</FormError>

        {issued ? (
          <div
            className="rounded-[10px] px-4 py-3.5 flex items-center gap-3"
            style={{ background: "var(--surface-2)" }}
          >
            <Icon name="key" size={15} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
            <span
              dir="ltr"
              className="text-[17px] font-semibold tracking-[0.12em] flex-1"
              style={{ fontFamily: "ui-monospace, Menlo, monospace" }}
            >
              {issued}
            </span>
            <span className="text-[11px] shrink-0" style={{ color: "var(--text-faint)" }}>
              30 min
            </span>
          </div>
        ) : (
          /* No code was issued, because no account matched — said this way
             rather than naming the address, for the reason in handleRequest. */
          <p
            className="rounded-[10px] px-4 py-3.5 text-[12.5px] leading-[1.5]"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            If an account exists for that email, its code is shown here. Nothing appeared, so check
            the address — or{" "}
            <Link href="/signup" style={{ color: "var(--accent-text)" }}>
              create an account
            </Link>
            .
          </p>
        )}

        <TextField
          label="Reset code"
          dir="ltr"
          placeholder="ABCD1234EFGH"
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
          error={errors.token}
          autoComplete="one-time-code"
        />

        <PasswordField
          label="New password"
          placeholder="At least 8 characters"
          value={password}
          strength
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm new password"
          placeholder="Type it again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <PillButton type="submit" variant="primary" className="w-full mt-1" disabled={busy}>
          {busy ? "Saving…" : "Set new password"}
        </PillButton>
        <p className="text-[11.5px] leading-[1.5]" style={{ color: "var(--text-faint)" }}>
          You&apos;ll be asked to sign in with the new password — changing it doesn&apos;t sign you
          in by itself.
        </p>
      </form>
    </AuthShell>
  );
}
