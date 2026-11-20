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
      <div className="hidden w-sidebar shrink-0 flex-col gap-space-6 bg-sidebar p-space-4 shadow-[inset_-1px_0_0_var(--hairline-strong)] rtl:shadow-[inset_1px_0_0_var(--hairline-strong)] md:flex">
        <div className="flex items-center gap-space-4 py-space-2">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-sm" />
        </div>
        <Skeleton className="h-14 w-full rounded-card" />
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-7 w-3/4 rounded-lg" />)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-space-6 p-space-10">
        <Skeleton className="h-4 w-48 rounded-sm" />
        <Skeleton className="h-8 w-64 rounded-sm" />
        <Skeleton className="min-h-0 w-full flex-1 rounded-card" />
      </div>
    </div>
  );
}
