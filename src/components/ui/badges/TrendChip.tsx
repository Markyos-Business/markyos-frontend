import { Icon } from "../primitives/Icon";

type TrendDirection = "up" | "down" | "neutral";

type TrendChipProps = {
  direction?: TrendDirection;
  /** The change, already formatted: "12%", "+3". */
  value: string;
  /** For screen readers, e.g. "up 12% on last month". Default: the direction and value. */
  label?: string;
  className?: string;
};

const tones: Record<TrendDirection, string> = {
  up: "bg-success-soft text-success",
  neutral: "bg-success-soft text-success",
  down: "bg-danger-soft text-danger",
};

const icons: Record<TrendDirection, string> = {
  up: "arrow-circle-up",
  down: "arrow-circle-down",
  neutral: "minus-circle",
};

/** Which way a number moved, as a small tinted chip with a circled arrow. */
const TrendChip = ({ direction = "neutral", value, label, className = "" }: TrendChipProps) => (
  <span
    aria-label={label ?? `${direction} ${value}`}
    className={`inline-flex h-badge items-center gap-space-1 rounded-xl px-2 text-caption font-medium ${tones[direction]} ${className}`}
  >
    <Icon name={icons[direction]} size={16} />
    <span aria-hidden>{value}</span>
  </span>
);

export { TrendChip };
export type { TrendChipProps, TrendDirection };
