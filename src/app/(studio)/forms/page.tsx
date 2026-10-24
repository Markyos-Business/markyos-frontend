"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { Icon } from "@/components/ui";
import { AccountMenu } from "@/components/features/account";
import { DiscoveryFrame, FormsListView } from "@/components/features/discovery";

/** Every discovery form across the studio's brands. */
export default function StudioFormsPage() {
  const { state, hydrated } = useApp();
  const account = useCurrentAccount();
  const router = useRouter();
  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login?next=/forms");
  }, [hydrated, state.session, router]);
  if (!hydrated || !state.session) return null;
  const isAr = account?.adminLang === "ar";
  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex h-screen flex-col">
      <header className="flex h-topbar shrink-0 items-center justify-between px-space-6 sm:px-space-10">
        <Link href="/brands" className="mk-tap gap-space-3 text-body font-medium text-text-muted hover:text-text">
          <Icon name="arrow-left" size={18} className="rtl:-scale-x-100" />
          {isAr ? "العلامات" : "Brands"}
        </Link>
        <AccountMenu isAr={isAr} />
      </header>
      <DiscoveryFrame isAr={isAr}>
        <FormsListView newFormHref="/forms/new" isAr={isAr} />
      </DiscoveryFrame>
    </div>
  );
}
