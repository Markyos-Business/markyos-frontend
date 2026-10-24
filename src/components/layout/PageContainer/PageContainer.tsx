import type { ReactNode } from "react";

/** The scrolling body of a page inside `AppLayout`, centred and padded. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-8 sm:px-10">{children}</div>
    </main>
  );
}
