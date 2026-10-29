import type { ReactNode } from "react";
import { Badge, type BadgeSize } from "./Badge";
import { tagTone, type TagTone } from "./variants";

type TagProps = {
  /** The tint: soft fill with the tone as ink. Default `neutral`. */
  tone?: TagTone;
  /** `sm` sits in a table cell (24px); `md` is the spec's 36px tag. Default `sm`. */
  size?: BadgeSize;
  /** An `<Icon>` before the label. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A label for a kind of thing — a role, a plan, a type. Status uses StatusDot. */
const Tag = ({ tone = "neutral", size = "sm", icon, className = "", children }: TagProps) => (
  <Badge tone={tagTone(tone)} size={size} icon={icon} className={className}>
    {children}
  </Badge>
);

export { Tag };
export type { TagProps };
