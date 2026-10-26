"use client";

import Link from "next/link";
import { Icon } from "@/components/ui";

/** The marketplace's top bar: the way back to the brands. */
export function TemplatesHeader() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-4 px-8 shadow-[inset_0_-1px_0_var(--hairline)]">
      <Link href="/brands" className="mk-tap gap-2 text-[13px] text-text-muted">
        <Icon name="angle-left" size={14} />
        Brands
      </Link>
    </div>
  );
}
