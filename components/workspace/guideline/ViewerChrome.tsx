"use client";

import { FormEvent, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { TextField } from "@/components/TextField";
import { PillButton } from "@/components/PillButton";
import { getBrandTheme, themeCssVars } from "@/lib/theme";

/** Wrong guesses allowed before the form stops answering. */
const MAX_TRIES = 3;
const LOCK_MS = 15 * 60 * 1000;

const lockKey = (slug: string) => `markyos:client-lock:${slug}`;

function readLockUntil(slug: string): number {
  try {
    const raw = window.sessionStorage.getItem(lockKey(slug));
    const until = raw ? Number(raw) : 0;
    return Number.isFinite(until) && until > Date.now() ? until : 0;
  } catch {
    return 0;
  }
}

/** The password gate and the "not available" / "invalid link" messages a
 *  guideline-site route shows before real content mounts — shared by the
 *  Home route and the per-page route so neither has its own copy. */
export function PasswordGate({
  name,
  slug,
  expected,
  isAr,
  theme,
  onUnlock,
}: {
  name: string;
  slug: string;
  expected: string;
  isAr: boolean;
  theme: ReturnType<typeof getBrandTheme>;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState("");
  const [used, setUsed] = useState(0);
  // Separate from `used` on purpose: typing clears the message, but it must not
  // clear the count, or the third try never arrives and the lock never trips.
  const [showError, setShowError] = useState(false);
  // Read straight out of storage on mount. This component only ever renders
  // after the viewer has hydrated, so there is no server pass to disagree with.
  const [lockedUntil, setLockedUntil] = useState(() => readLockUntil(slug));
  const [now, setNow] = useState(() => Date.now());

  const locked = lockedUntil > now;
  const left = Math.max(0, MAX_TRIES - used);

  // Only ticks while the countdown is on screen — a timer that keeps running
  // after the lock expires is a render every second for the rest of the visit.
  useEffect(() => {
    if (!locked) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [locked]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (locked) return;
    if (value === expected) {
      try {
        window.sessionStorage.removeItem(lockKey(slug));
      } catch {
        // best-effort only
      }
      onUnlock();
      return;
    }
    const next = used + 1;
    setValue("");
    setShowError(true);
    if (next >= MAX_TRIES) {
      const until = Date.now() + LOCK_MS;
      try {
        window.sessionStorage.setItem(lockKey(slug), String(until));
      } catch {
        // Without storage the lock lasts only as long as this page stays open.
        // That is a real limit of a client-only build, and the wording below
        // doesn't promise otherwise.
      }
      setUsed(0);
      setLockedUntil(until);
      setNow(Date.now());
      return;
    }
    setUsed(next);
  }

  const remainingMs = Math.max(0, lockedUntil - now);
  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);
  const countdown = `${mm}:${String(ss).padStart(2, "0")}`;

  /*
   * Three states, three different things to say.
   *
   * The old gate said "That password isn't right" and nothing else, so a
   * client working through the two passwords they'd been sent had no idea they
   * were about to be locked out, and no idea where to get the right one. A
   * wrong password is usually a lost email, not an intruder — so the resting
   * state names who to ask, and the error counts down out loud.
   */
  const error = locked
    ? isAr
      ? `محاولات كثيرة. حاول بعد ${countdown}.`
      : `Too many attempts. Try again in ${countdown}.`
    : showError && used > 0
      ? isAr
        ? `كلمة المرور غير صحيحة. بقيت ${left} محاولة.`
        : `That password doesn't match. ${left} ${left === 1 ? "try" : "tries"} left.`
      : undefined;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-8"
      style={{ ...themeCssVars(theme), background: "var(--g-canvas)", color: "var(--g-text)", fontFamily: isAr ? "var(--font-arabic)" : undefined }}
    >
      <div className="flex flex-col items-center gap-2">
        <Icon name="lock" size={26} style={{ color: "var(--g-accent)" }} />
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{name}</h1>
        <p className="text-[13px]" style={{ color: "var(--g-text-muted)" }}>
          {isAr ? "دليل الهوية هذا محمي بكلمة مرور." : "This brand guideline is password-protected."}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-[360px] rounded-[18px] p-[26px] flex flex-col gap-3.5" style={{ background: "var(--g-surface-1)" }}>
        <TextField
          label={isAr ? "كلمة المرور" : "Access password"}
          type="password"
          autoFocus
          disabled={locked}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (showError) setShowError(false);
          }}
          error={error}
        />
        <PillButton type="submit" variant="primary" className="w-full" disabled={locked}>
          {isAr ? "عرض الدليل" : "View guideline"}
        </PillButton>
        <p className="text-[12px] leading-[1.55] text-center" style={{ color: "var(--g-text-muted)" }}>
          {locked
            ? isAr
              ? `يُفتح الرابط تلقائيًا بعد ${countdown}.`
              : `The link unlocks again on its own in ${countdown}.`
            : isAr
              ? `كلمة المرور وصلتك مع رسالة التسليم — اسأل ${name} إن لم تكن لديك. بعد ${MAX_TRIES} محاولات يُقفل الرابط ١٥ دقيقة.`
              : `The password came with your hand-off email — ask ${name} if you don't have it. After ${MAX_TRIES} tries the link locks for 15 minutes.`}
        </p>
      </form>
    </div>
  );
}

export function CenteredMessage({
  icon,
  title,
  arTitle,
  body,
  arBody,
  isAr,
  theme,
}: {
  icon: string;
  title: string;
  arTitle: string;
  body: string;
  arBody: string;
  isAr: boolean;
  theme?: ReturnType<typeof getBrandTheme>;
}) {
  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center justify-center gap-3 px-8 text-center"
      style={theme ? { ...themeCssVars(theme), background: "var(--g-canvas)", color: "var(--g-text)", fontFamily: isAr ? "var(--font-arabic)" : undefined } : { fontFamily: isAr ? "var(--font-arabic)" : undefined }}
    >
      <Icon name={icon} size={28} style={{ color: theme ? "var(--g-text-faint)" : "var(--text-faint)" }} />
      <h1 dir="auto" className="bidi-auto text-[20px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{isAr ? arTitle : title}</h1>
      <p className="text-[13px] max-w-[360px]" style={{ color: theme ? "var(--g-text-muted)" : "var(--text-muted)" }}>{isAr ? arBody : body}</p>
    </div>
  );
}
