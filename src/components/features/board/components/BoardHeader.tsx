"use client";

import Link from "next/link";
import { AccountMenu } from "@/components/features/account";
import { useInterfaceLang } from "@/contexts/useInterfaceLang";

/** The board's top bar: the wordmark, the way back to the brands, and the account. */
export function BoardHeader() {
  const { isAr } = useInterfaceLang();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex min-h-[68px] shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3 shadow-[inset_0_-1px_0_var(--hairline)] sm:px-10">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/markyos-wordmark.svg" alt="Markyos" className="h-[13px] opacity-90 [filter:var(--chrome-mark-invert)]" />
        <Link href="/brands" className="mk-tap text-[13px] font-medium text-text-muted">
          {t("Brands", "العلامات")}
        </Link>
        <span className="text-[13px] font-medium">{t("Board", "اللوحة")}</span>
      </div>
      <AccountMenu />
    </div>
  );
}
