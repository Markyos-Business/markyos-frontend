import type { ReactNode } from "react";
import { SOFT_VARIANT_CLASSES, type BadgeTone } from "./variants";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

/** A short status or count, as a tinted pill. */
const Badge = ({ tone = "neutral", children }: BadgeProps) => (
  <span className={`shrink-0 rounded-full px-2.5 py-1 text-ui-2xs font-semibold ${SOFT_VARIANT_CLASSES[tone]}`}>
    {children}
  </span>
);

export { Badge };
export type { BadgeProps };
