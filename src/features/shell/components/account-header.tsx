"use client";

import { BetaNotice } from "./beta-notice";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { isReviewerOnly } from "@/lib/data/access";
import { useDocumentLang, useInterfaceLang } from "@/contexts/useInterfaceLang";
import { accountTypeOf } from "@/constants/accountTypes";
import { accountNavigation } from "@/lib/data/accountNavigation";
import { API_ENABLED } from "@/lib/api/client";
import { AccountMenu } from "@/features/account";
import { MarkyosLogo } from "@/components/ui";

/** The same location and way back on every account-level page. */
export function AccountHeader({ search }: { search?: ReactNode }) {
  const { isAr, lang, settled } = useInterfaceLang();
  // Every account-level page has this header, so <html> follows the reader's
  // language here; the brands home had no other guard that set it.
  useDocumentLang(lang, settled);
  const account = useCurrentAccount();
  const pathname = usePathname();
  const { state, myWorkspaces } = useApp();
  const links = accountNavigation(accountTypeOf(account), API_ENABLED, isReviewerOnly(myWorkspaces, state.session));
  return <><header className="mk-no-hover flex min-h-topbar shrink-0 flex-wrap items-center gap-space-4 px-space-6 py-space-4 sm:px-space-10">
    <Link href="/brands" aria-label={isAr ? "العلامات" : "Brands"} className="mk-tap shrink-0"><MarkyosLogo variant="wordmark" className="h-3.5" isAr={isAr} /></Link>
    <nav aria-label={isAr ? "تنقل الحساب" : "Account navigation"} className="hidden min-w-0 flex-1 flex-wrap items-center gap-space-4 md:flex">
      {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}
        className={`mk-tap text-body ${pathname === link.href ? "font-medium text-accent-text" : "text-text-muted"}`}>{isAr ? link.arLabel : link.label}</Link>)}
    </nav>
    {search && <div className="ms-auto w-36 sm:w-48">{search}</div>}
    <div className={search ? "" : "ms-auto"}><AccountMenu phoneLinks={links} /></div>
  </header><BetaNotice /></>;
}
