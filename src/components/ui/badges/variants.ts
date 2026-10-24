// The badge colours, in one place so every badge reads the same.
type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const SOFT_VARIANT_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-text-muted",
  accent: "bg-accent-soft text-accent-on-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export { SOFT_VARIANT_CLASSES };
export type { BadgeTone };
