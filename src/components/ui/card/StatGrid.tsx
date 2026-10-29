import type { ReactNode } from "react";

type StatGridProps = {
  /** Usually StatCards. */
  children: ReactNode;
  className?: string;
};

/** StatCards in a row: four across on a desktop, two on a tablet, one on a phone. */
const StatGrid = ({ children, className = "" }: StatGridProps) => (
  <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</div>
);

export { StatGrid };
export type { StatGridProps };
