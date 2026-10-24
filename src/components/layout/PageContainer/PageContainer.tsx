import type { ReactNode } from "react";

/** The scrolling body of a page inside `AppLayout`, centred and padded. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-space-6 pb-space-10 sm:px-space-10">{children}</div>
    </main>
  );
}
