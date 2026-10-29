import { IconBadge } from "../badges/IconBadge";
import type { BadgeTone } from "../badges/variants";

type ActivityItem = {
  id: string;
  /** An icon name from the icon set. */
  icon: string;
  tone?: BadgeTone;
  title: string;
  /** A second line: who, or where. */
  meta?: string;
  /** Already relative and short: "10m", "2d", "12 Sep". */
  time: string;
  /** The exact moment, for the time's tooltip and screen readers. */
  dateTime?: string;
};

type ActivityFeedProps = {
  items: ActivityItem[];
  className?: string;
};

/** What happened, newest first: an icon tile, the event, and when (spec §6.14 ActivityRow). */
const ActivityFeed = ({ items, className = "" }: ActivityFeedProps) => (
  <ol className={`flex flex-col ${className}`}>
    {items.map((item) => (
      <li key={item.id} className="flex min-h-widget-row items-center gap-space-5 py-space-3 shadow-rule-t first:shadow-none">
        <IconBadge icon={item.icon} tone={item.tone ?? "accent"} />
        <div className="min-w-0 flex-1">
          <p dir="auto" className="bidi-auto truncate text-body font-medium text-text">
            {item.title}
          </p>
          {item.meta && (
            <p dir="auto" className="bidi-auto truncate text-caption text-text-muted">
              {item.meta}
            </p>
          )}
        </div>
        <time dateTime={item.dateTime} title={item.dateTime} className="shrink-0 text-caption font-medium text-text-muted">
          {item.time}
        </time>
      </li>
    ))}
  </ol>
);

export { ActivityFeed };
export type { ActivityFeedProps, ActivityItem };
