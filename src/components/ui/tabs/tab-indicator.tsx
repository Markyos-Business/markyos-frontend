type TabIndicatorVariant = "pill" | "underline";

// The spec's text tab (§6.11): the active tab sits on a raised pill with a
// hairline. `underline` is a bar under the label, for a tab row that runs
// along the top edge of a card.
const variants: Record<TabIndicatorVariant, string> = {
  pill: "inset-0 -z-10 rounded-lg bg-surface-2 shadow-edge",
  underline: "inset-x-0 -bottom-px h-0.5 rounded-full bg-accent",
};

type TabIndicatorProps = {
  variant?: TabIndicatorVariant;
};

/**
 * The active tab's highlight, drawn inside the active tab. It doesn't travel
 * between tabs: motion in the product is colour and opacity only. The tab
 * button needs `relative isolate` so the pill sits under its label.
 */
const TabIndicator = ({ variant = "pill" }: TabIndicatorProps) => (
  <span aria-hidden className={`pointer-events-none absolute ${variants[variant]}`} />
);

export { TabIndicator };
export type { TabIndicatorProps, TabIndicatorVariant };
