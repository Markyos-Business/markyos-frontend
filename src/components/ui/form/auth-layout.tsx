import type { ReactNode } from "react";

type AuthLayoutProps = {
  /** The page's one heading: "Sign in", "Check your email". */
  title: string;
  subtitle?: ReactNode;
  /** Above the card: the logo, usually a link home. */
  brand?: ReactNode;
  /** Pinned to the top end corner: the language switch. */
  corner?: ReactNode;
  /** Under the card: "New to Markyos? Create an account". */
  footer?: ReactNode;
  /** Fill the screen (a real page). False to sit inside another layout (a gallery, a preview). Default true. */
  fill?: boolean;
  children: ReactNode;
};

/**
 * The signed-out screens' frame: login, sign-up, forgot password, a code
 * check. A centred 440px card with the page's `<h1>` and a line under it,
 * the logo above, links below, and the language switch in the corner,
 * because these screens come before there's an account to keep a choice on.
 * `<main>` and a real `<h1>`: these are the pages someone reaches with no
 * session, so their structure matters most.
 */
const AuthLayout = ({ title, subtitle, brand, corner, footer, fill = true, children }: AuthLayoutProps) => (
  <main className={`relative flex flex-col items-center justify-center gap-space-9 px-5 py-10 sm:px-8 ${fill ? "min-h-screen" : ""}`}>
    {corner && <div className={`${fill ? "fixed" : "absolute"} inset-e-5 top-5 z-sticky rounded-lg bg-canvas p-space-1 sm:inset-e-8`}>{corner}</div>}
    {brand}
    <div className="mk-surface flex w-full max-w-[440px] flex-col gap-field-stack rounded-card bg-surface-1 p-space-8 sm:p-space-10">
      <div className="flex flex-col gap-space-2">
        <h1 className="font-display text-[22px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] leading-[1.5] text-text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
    {footer && <div className="flex flex-wrap items-baseline justify-center gap-ctl-row text-[13px] text-text-muted">{footer}</div>}
  </main>
);

export { AuthLayout };
export type { AuthLayoutProps };
