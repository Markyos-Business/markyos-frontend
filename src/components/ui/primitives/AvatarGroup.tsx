"use client";

import { useUiStrings } from "../i18n/uiStrings";
import { Avatar } from "./Avatar";

type AvatarGroupPerson = { id: string; initials: string; src?: string | null; name: string };

type AvatarGroupProps = {
  people: AvatarGroupPerson[];
  /** How many to draw before "+n". Default 4. */
  max?: number;
  /** Diameter in pixels. Default 28. */
  size?: number;
  className?: string;
};

/** A few people, overlapping, then "+n" for the rest. Each is named for screen readers. */
const AvatarGroup = ({ people, max = 4, size = 28, className = "" }: AvatarGroupProps) => {
  const { t } = useUiStrings();
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <ul className={`flex items-center ${className}`} aria-label={people.map((p) => p.name).join(", ")}>
      {shown.map((p) => (
        <li key={p.id} className="-ms-2 rounded-full shadow-ring-status first:ms-0" title={p.name}>
          <Avatar initials={p.initials} src={p.src} size={size} />
        </li>
      ))}
      {rest > 0 && (
        <li
          className="-ms-2 grid place-items-center rounded-full bg-surface-3 text-caption font-medium text-text-muted shadow-ring-status"
          style={{ width: size, height: size }}
        >
          {t.more(rest)}
        </li>
      )}
    </ul>
  );
};

export { AvatarGroup };
export type { AvatarGroupPerson, AvatarGroupProps };
