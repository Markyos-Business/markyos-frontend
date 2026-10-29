import { DOT_VARIANT_CLASSES, type BadgeTone } from "./variants";

type StatusDotProps = {
  /** The dot's colour; the label stays muted (spec §6.8). Default `neutral`. */
  tone?: BadgeTone;
  /** What the status is, in words: colour alone is never the message. */
  label: string;
  className?: string;
};

/** A coloured 8px dot and a muted label: a status in running text or a cell. */
const StatusDot = ({ tone = "neutral", label, className = "" }: StatusDotProps) => (
  <span className={`inline-flex items-center gap-space-3 whitespace-nowrap text-caption text-text-muted ${className}`}>
    <span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT_VARIANT_CLASSES[tone]}`} />
    {label}
  </span>
);

export { StatusDot };
export type { StatusDotProps };
