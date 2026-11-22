"use client";

import { Skeleton } from "@/components/ui";

/**
 * What a brand page shows while the app is still loading the brand: the
 * sidebar's and the page's shapes, so the screen is never blank and nothing
 * jumps when the real page arrives. Never shown for a brand that turns out
 * not to exist; the layout sends that one to the gallery.
 */
export function BrandLoading() {
  return (
    <div aria-busy="true" className="flex h-screen overflow-hidden bg-canvas">
      {/* The sidebar's real shape (Overview and Drafts, then three labelled stages, then the bottom bar),
          so nothing moves when it arrives. */}
      <div className="hidden w-sidebar shrink-0 flex-col bg-sidebar px-space-4 shadow-[inset_-1px_0_0_var(--hairline-strong)] rtl:shadow-[inset_1px_0_0_var(--hairline-strong)] md:flex">
        <div className="flex items-center gap-space-4 px-space-2 py-space-6">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-col gap-space-2"><Skeleton className="h-3.5 w-28 rounded-sm" /><Skeleton className="h-3 w-16 rounded-sm" /></div>
        </div>
        <div className="flex flex-1 flex-col gap-space-1">
          {[2, 3, 3, 2].map((rows, group) => (
            <div key={group} className="flex flex-col gap-space-1">
              {group > 0 && <Skeleton className="mx-space-3 mb-space-2 mt-space-5 h-3 w-24 rounded-sm" />}
              {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex h-9 items-center gap-space-4 px-space-3">
                  <Skeleton className="size-7 rounded-lg" />
                  <Skeleton className="h-3.5 w-24 rounded-sm" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-space-2 py-space-5 shadow-rule-t">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-3.5 flex-1 rounded-sm" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="size-9 rounded-lg" />)}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-space-6 p-space-10">
        <Skeleton className="h-4 w-48 rounded-sm" />
        <Skeleton className="h-8 w-64 rounded-sm" />
        <Skeleton className="min-h-0 w-full flex-1 rounded-card" />
      </div>
    </div>
  );
}
