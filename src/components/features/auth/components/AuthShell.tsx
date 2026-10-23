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
    <main className="flex min-h-screen flex-col items-center justify-center gap-7 px-5 py-10 sm:px-8">
      <Link href="/" aria-label="Markyos home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/markyos-lockup.svg"
          alt="Markyos"
          // The lockup is drawn dark; the theme token inverts it on dark grounds.
          className="w-[190px] max-w-full [filter:var(--chrome-mark-invert)]"
        />
      </Link>

      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-[18px] bg-surface-1 p-6 sm:p-[30px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[22px] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-[13px] leading-[1.5] text-text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>

      {footer && <div className="flex flex-wrap justify-center gap-2 text-[13px] text-text-muted">{footer}</div>}
    </main>
  );
}
