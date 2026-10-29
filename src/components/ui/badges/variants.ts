// The status colours, in one place so every badge, dot and chip reads the
// same. All are theme tokens: each switches with light and dark and is held
// to the contrast audit (scripts/contrast-audit.mjs).
type BadgeTone = "neutral" | "info" | "accent" | "success" | "warning" | "attention" | "danger" | "indigo";

/** The brief's Tag names, for callers who think in them: primary is accent, danger is danger. */
type TagTone = "primary" | "success" | "warning" | "danger" | "neutral" | "indigo";

/** The tint rule (spec §2.2): the tone at about 14%, with the tone as ink. */
const SOFT_VARIANT_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text-muted",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-accent-on-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  attention: "bg-attention-soft text-attention",
  danger: "bg-danger-soft text-danger",
  indigo: "bg-indigo-soft text-indigo",
};

/** The 8px dot of a status tag: the only part of it that carries colour. */
const DOT_VARIANT_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-text-disabled",
  info: "bg-info",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  attention: "bg-attention",
  danger: "bg-danger-fill",
  indigo: "bg-indigo",
};

/** A full fill with the ink made for it: counts and urgent markers. */
const SOLID_VARIANT_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text",
  info: "bg-info text-status-ink",
  accent: "bg-accent text-accent-ink",
  success: "bg-success text-status-ink",
  warning: "bg-warning text-status-ink",
  attention: "bg-attention text-status-ink",
  danger: "bg-danger-fill text-danger-ink",
  indigo: "bg-indigo text-surface-0",
};

/** A Tag tone as a badge tone. */
const tagTone = (tone: TagTone): BadgeTone => (tone === "primary" ? "accent" : tone);

export { DOT_VARIANT_CLASSES, SOFT_VARIANT_CLASSES, SOLID_VARIANT_CLASSES, tagTone };
export type { BadgeTone, TagTone };
