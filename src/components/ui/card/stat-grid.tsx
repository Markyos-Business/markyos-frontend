import type { ReactNode } from "react";
import { Stagger } from "../motion/stagger";

type StatGridProps = {
  /** Usually StatCards. */
  children: ReactNode;
  className?: string;
};

/** StatCards in a row: four across on a desktop, two on a tablet, one on a phone. */
// The tiles arrive one after another, the first time only.
const StatGrid = ({ children, className = "" }: StatGridProps) => (
  <Stagger className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</Stagger>
);

export { StatGrid };
export type { StatGridProps };
