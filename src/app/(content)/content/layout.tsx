import { Suspense, type ReactNode } from "react";
import { ContentShell } from "@/features/content";

// The shell reads the section from the address (?kind=), so it waits for it.
export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <ContentShell>{children}</ContentShell>
    </Suspense>
  );
}
