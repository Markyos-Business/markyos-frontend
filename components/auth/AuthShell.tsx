"use client";

import Link from "next/link";
import { ReactNode } from "react";

/**
 * The frame around every signed-out screen.
 *
 * Login, registration and password reset were three separately-built pages
 * that happened to look similar, which is how the logo ended up a different
 * size on one of them and the footer link a different colour on another. One
 * component means the three genuinely match, and a fourth screen inherits the
 * layout instead of re-deriving it.
 *
 * `<main>` and a real `<h1>` because these are the only pages someone can
 * reach with no session: if the heading structure is wrong anywhere, it is
 * worst here, at the door.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-7 px-5 sm:px-8 py-10">
      <Link href="/" aria-label="Markyos home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/markyos-lockup.svg"
          alt="Markyos"
          style={{ width: 190, maxWidth: "100%", filter: "var(--chrome-mark-invert)" }}
        />
      </Link>

      <div
        className="w-full max-w-[440px] rounded-[18px] p-6 sm:p-[30px] flex flex-col gap-4"
        style={{ background: "var(--surface-1)" }}
      >
        <div className="flex flex-col gap-1.5">
          <h1
            className="text-[22px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] leading-[1.5]" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>

      {footer && (
        <div className="flex flex-wrap justify-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {footer}
        </div>
      )}
    </main>
  );
}

/**
 * A whole-form error, as opposed to a per-field one.
 *
 * "That email and password don't match an account" belongs to the pair, not to
 * either box, so putting it under one of them points the finger at the wrong
 * field. `role="alert"` so it is announced the moment it appears — a submit
 * that silently fails is the single most disorienting thing a login form can
 * do.
 */
export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="rounded-[10px] px-3.5 py-3 text-[12.5px] leading-[1.5]"
      style={{
        background: "color-mix(in srgb, var(--danger) 12%, transparent)",
        color: "var(--danger)",
        boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--danger) 35%, transparent)",
      }}
    >
      {children}
    </div>
  );
}
