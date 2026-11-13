import type { ReactNode } from "react";

/** One kind of finding in the import review: a title, what it means, and the findings. */
export function ImportGroup({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption font-medium">{title}</span>
      <p className="max-w-[62ch] text-caption text-text-faint">{hint}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Said in place of findings when the file had none of that kind. */
export function ImportBlank({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-surface-1 px-space-6 py-space-5 text-caption text-text-faint">{children}</div>;
}
