"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui";

type StudioHeaderProps = { isAr: boolean; end?: ReactNode };

/** The top bar of a studio-wide page: the way back to the brands, and anything at the end. */
export function StudioHeader({ isAr, end }: StudioHeaderProps) {
  return (
    <header className="flex h-topbar shrink-0 items-center justify-between px-space-6 sm:px-space-10">
      {/* The arrow points back the way you came, so it turns in Arabic. */}
      <Link href="/brands" className="mk-tap gap-space-3 text-body font-medium text-text-muted hover:text-text">
        <Icon name="arrow-left" size={18} className="rtl:-scale-x-100" />
        {isAr ? "العلامات" : "Brands"}
      </Link>
      {end}
    </header>
  );
}
