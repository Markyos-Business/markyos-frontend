"use client";

import { FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Button, Icon, Avatar, Section, Row, Badge } from "@/components/ui";
import { InputField } from "@/components/form";
import { PasswordField, EMAIL_RE, isPlaintext, scorePassword } from "@/components/features/auth";
import { initialsFor, formatRelative } from "@/lib/utils";

/**
 * The person's own details, as opposed to any brand's.
 *
 * Name and email commit on blur rather than per keystroke — the same reason the
 * brand name does: a store write per character fills the history with
 * half-typed values.
 */
export function ProfilePanel() {
  const { state, updateAccount, setAccountPassword, logout } = useApp();
  const { showToast } = useToast();
  const account = state.accounts.find((a) => a.id === state.session?.accountId);

  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [emailError, setEmailError] = useState<string | undefined>();

  const [changingPassword, setChangingPassword] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});

  if (!account) return null;
  // Every account has one now — registration requires it. What varies is
  // whether it is still stored in the readable form an older build wrote.
  const readable = isPlaintext(account.password);

  async function commitName() {
    const value = name.trim();
    if (!value || value === account!.name) {
      setName(account!.name);
      return;
    }
    const failed = await updateAccount({ name: value });
    if (failed) {
      setName(account!.name);
      showToast(failed, "danger");
      return;
    }
    showToast("Name updated.", "success");
  }

  async function commitEmail() {
    const value = email.trim();
    if (value === account!.email) {
      setEmailError(undefined);
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    // The store rejects an email another account already uses — otherwise the
    // two would collide at sign-in and the second person would be locked out.
    const failed = await updateAccount({ email: value });
    if (failed) {
      setEmailError(failed);
      return;
    }
    setEmailError(undefined);
    showToast("Email updated — you'll sign in with this from now on.", "success");
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: typeof pwErrors = {};
    if (!current) errs.current = "Enter your current password.";
    if (next.length < 8) errs.next = "Use at least 8 characters.";
    else if (scorePassword(next).score === 0) errs.next = "That one is too easy to guess.";
    if (next !== confirm) errs.confirm = "These don't match.";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    const failed = await setAccountPassword(next, current);
    setBusy(false);
    if (failed) {
      setPwErrors({ current: failed });
      return;
    }
    setChangingPassword(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    showToast("Password changed — it's checked the next time you sign in.", "success");
  }

  return (
    <>
      <Section title="Profile" icon="user">
        <div className="flex items-center gap-4">
          <Avatar initials={initialsFor(account.name || account.email)} size={56} tone="accent" />
          <div className="min-w-0">
            <div dir="auto" className="bidi-auto text-h5 font-medium truncate">{account.name}</div>
            <div dir="ltr" className="text-caption truncate text-text-muted">{account.email}</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <InputField
            label="Name"
            value={name}
            dir="auto"
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setName(account.name);
            }}
            placeholder="Your name"
          />
          <InputField
            label="Email"
            type="email"
            value={email}
            dir="ltr"
            error={emailError}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={commitEmail}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setEmail(account.email);
                setEmailError(undefined);
              }
            }}
            placeholder="you@studio.com"
            hint="This is the address you sign in with."
          />
        </div>
      </Section>

      <Section title="Password" icon="key">
        <Row
          label="Password"
          hint={
            readable
              ? "Stored in readable form by an older version of this app. Change it here and it's replaced with a derived key."
              : `Last changed ${account.passwordUpdatedAt ? formatRelative(account.passwordUpdatedAt) : "just now"}. It is checked every time you sign in.`
          }
          right={
            <div className="flex items-center gap-2.5 shrink-0">
              <Badge tone={readable ? "warning" : "success"}>{readable ? "Readable" : "Hashed"}</Badge>
              <Button variant="outline" size="sm" onClick={() => setChangingPassword((v) => !v)}>
                {changingPassword ? "Cancel" : "Change"}
              </Button>
            </div>
          }
        />

        {changingPassword && (
          <form onSubmit={handlePassword} className="rounded-widget p-space-8 flex flex-col gap-space-5 bg-surface-sunken shadow-edge-soft">
            <PasswordField
              label="Current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              error={pwErrors.current}
              autoComplete="current-password"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <PasswordField
                label="New password"
                value={next}
                strength
                onChange={(e) => setNext(e.target.value)}
                error={pwErrors.next}
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={pwErrors.confirm}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="self-start" disabled={busy}>
              {busy ? "Saving…" : "Change password"}
            </Button>
            {/* Said plainly rather than implied: this build keeps everything in
                this browser, so a password here is a local gate, not an account
                on a server somewhere. What hashing buys is that the string
                stored here isn't the one that opens your email too. */}
            <p className="text-caption text-text-faint">
              This build stores your data in this browser, so the password guards this browser&apos;s
              copy — it is never sent anywhere. It is kept as a PBKDF2-derived key rather than the
              password itself, so what sits in storage can&apos;t be read back and tried elsewhere.
              Clearing site data still erases the account, and a forgotten password is reset from
              the login screen.
            </p>
          </form>
        )}
      </Section>

      <Section title="Session" icon="lock">
        <Row
          label="Signed in"
          hint={`Since this browser last authenticated${account.createdAt ? ` · account created ${formatRelative(account.createdAt)}` : ""}.`}
          right={
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              icon={<Icon name="sign-out-alt" size={16} />}
              onClick={() => {
                logout();
                showToast("Signed out.");
              }}
            >
              Sign out
            </Button>
          }
        />
      </Section>
    </>
  );
}
