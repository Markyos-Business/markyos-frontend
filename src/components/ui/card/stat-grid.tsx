import type { ReactNode } from "react";
import { Stagger } from "../motion/stagger";

type StatGridProps = {
  /** Usually StatCards. */
  children: ReactNode;
  className?: string;
};

/** StatCards in a row: four across on a desktop, two on a tablet and on a phone (one per row pushed the content under four screens of counts). */
// The tiles arrive one after another, the first time only.
const StatGrid = ({ children, className = "" }: StatGridProps) => (
  <Stagger className={`grid grid-cols-2 gap-space-3 sm:gap-5 xl:grid-cols-4 ${className}`}>{children}</Stagger>
);

export { StatGrid };
export type { StatGridProps };
