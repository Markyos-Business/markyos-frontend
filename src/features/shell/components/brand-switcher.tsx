"use client";

import Link from "next/link";
import { Icon, Popover } from "@/components/ui";
import { useApp } from "@/contexts/AppContext";
import { brandInitials, brandMarkUrl } from "@/lib/data/brandSetup";
import type { Workspace } from "@/types";

/** A brand's mark at avatar size: its logo, else one letter. */
function BrandMark({ ws, size }: { ws: Workspace; size: "sm" | "md" }) {
  const logo = brandMarkUrl(ws);
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-body font-medium text-text ${size === "md" ? "size-9" : "size-8"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a stored brand file, any origin */}
      {logo ? <img src={logo} alt="" className="size-full object-contain p-1" /> : brandInitials(ws.name)}
    </span>
  );
}

/**
 * Quick navigation between brands, from the sidebar header: every brand this
 * person can open, the current one ticked, then all brands and a new one.
 * Opening a brand lands on its overview.
 */
export function BrandSwitcher({ currentId, isAr }: { currentId: string; isAr: boolean }) {
  const { myWorkspaces } = useApp();
  const plan = (ws: Workspace) => (ws.billing.plan === "free" ? (isAr ? "خطة مجانية" : "Free plan") : isAr ? "خطة مدفوعة" : "Paid plan");
  const label = isAr ? "التبديل بين العلامات" : "Switch brand";
  return (
    <Popover label={label} width={280} align="start" button={<span className="grid size-7 place-items-center rounded-lg text-text-muted"><Icon name="sort" size={16} /></span>}>
      {(close) => (
        <div dir={isAr ? "rtl" : "ltr"} className="flex flex-col py-space-2">
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {myWorkspaces.map((ws) => {
              const current = ws.id === currentId;
              return (
                <Link
                  key={ws.id}
                  href={`/w/${ws.slug}/overview`}
                  onClick={close}
                  aria-current={current ? "page" : undefined}
                  className="mk-nav-item flex items-center gap-space-4 px-space-5 py-space-3"
                >
                  <BrandMark ws={ws} size="md" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span dir="auto" className="truncate text-body font-medium text-text [text-align:match-parent]">{ws.name}</span>
                    <span className="truncate text-caption text-text-muted">{plan(ws)}</span>
                  </span>
                  {current && <Icon name="check" size={16} className="shrink-0 text-accent" />}
                </Link>
              );
            })}
          </div>
          <div className="mt-space-2 flex flex-col pt-space-2 shadow-rule-t">
            <Link href="/brands" onClick={close} className="mk-nav-item flex items-center gap-space-4 px-space-5 py-space-3 text-body text-text-muted">
              <Icon name="th-large" size={16} />
              {isAr ? "كل العلامات" : "All brands"}
            </Link>
            <Link href="/brands/new" onClick={close} className="mk-nav-item flex items-center gap-space-4 px-space-5 py-space-3 text-body text-text">
              <Icon name="plus" size={16} />
              {isAr ? "مساحة عمل جديدة" : "New workspace"}
            </Link>
          </div>
        </div>
      )}
    </Popover>
  );
}
