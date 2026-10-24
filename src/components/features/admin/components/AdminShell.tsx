"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_ENABLED } from "@/lib/api/client";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { ThemeToggle } from "@/contexts/ThemeProvider";
import { AccountMenu } from "@/components/features/account";
import { Icon } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "chart-line" },
  { href: "/admin/users", label: "Users", icon: "users" },
];

/**
 * The platform admin area's frame, and its gate.
 *
 * The server refuses every admin call from anyone else; this only keeps a
 * member from landing on a page of errors. Without a backend there is no
 * platform to administer, so the area doesn't exist.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { state, hydrated } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = API_ENABLED && !!account?.isAdmin;

  useEffect(() => {
    if (!hydrated) return;
    if (!state.session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace("/brands");
  }, [hydrated, state.session, allowed, router, pathname]);

  if (!hydrated || !state.session || !allowed) return null;

  return (
    <div dir="ltr" className="flex min-h-screen flex-col">
      <header className="flex min-h-[64px] shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3 shadow-[inset_0_-1px_0_var(--hairline)] sm:px-10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/markyos-wordmark.svg" alt="Markyos" className="h-[13px] opacity-90 [filter:var(--chrome-mark-invert)]" />
          <span className="rounded-pill bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent-on-soft">Admin</span>
        </div>
        <nav aria-label="Admin" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center gap-2 rounded-pill px-3.5 text-[13px] font-medium ${
                  active ? "bg-surface-2 text-text" : "text-text-muted hover:text-text"
                }`}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/brands" className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text">
            <Icon name="arrow-left" size={14} className="rtl:-scale-x-100" />
            Studio
          </Link>
          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-5 py-8 sm:px-10">{children}</main>
    </div>
  );
}
