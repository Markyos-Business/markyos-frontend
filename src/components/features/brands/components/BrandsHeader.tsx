"use client";

import Link from "next/link";
import { SearchField } from "@/components/form";
import { AccountMenu } from "@/components/features/account";
import { STUDIO_LINKS } from "../constants";

type BrandsHeaderProps = { query: string; onQuery: (query: string) => void };

/**
 * The gallery's top bar: 84px and transparent. It wraps on a phone, so the
 * search field and the avatar never push past the edge.
 */
export function BrandsHeader({ query, onQuery }: BrandsHeaderProps) {
  return (
    <header className="min-h-topbar shrink-0 flex flex-wrap items-center justify-between gap-space-5 px-space-6 sm:px-space-10 py-space-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/markyos-wordmark.svg" alt="Markyos" className="h-3.5 [filter:var(--chrome-mark-invert)]" />
      <div className="flex items-center gap-space-6">
        <div className="w-36 sm:w-56">
          <SearchField label="Search brands" placeholder="Search brands…" value={query} onChange={(e) => onQuery(e.target.value)} />
        </div>
        {/* On a phone these fold into the account menu, so the search keeps
            room to type in. Not `mk-tap`: its display is forced and would
            beat `hidden`. */}
        {STUDIO_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hidden min-h-6.5 items-center text-body font-medium text-text-muted hover:text-text sm:inline-flex">
            {link.label}
          </Link>
        ))}
        {/* The avatar is the way to the account; no text link beside it. */}
        <AccountMenu phoneLinks={STUDIO_LINKS} />
      </div>
    </header>
  );
}
