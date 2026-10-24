import { Icon } from "../primitives/Icon";
import { SOFT_VARIANT_CLASSES, type BadgeTone } from "./variants";

type IconBadgeProps = {
  /** An icon name from the icon set. */
  icon: string;
  tone?: BadgeTone;
  className?: string;
};

/**
 * The spec's icon tile (§4): the glyph centred on a 46px square with an 8px
 * radius, on its tone's tint. Heads a section, an empty state or a row.
 */
const IconBadge = ({ icon, tone = "accent", className = "" }: IconBadgeProps) => (
  <span
    aria-hidden
    className={`flex size-control shrink-0 items-center justify-center rounded-lg ${SOFT_VARIANT_CLASSES[tone]} ${className}`}
  >
    <Icon name={icon} size={22} />
  </span>
);

export { IconBadge };
export type { IconBadgeProps };
