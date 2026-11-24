/** Markyos surface and focus recipes; all colours come from the host theme. */
// A card edge is `--hairline-strong` (tokens.js); `--hairline` is the 5% divider inside a surface.
export const card = "rounded-card border border-hairline-strong bg-surface-1 text-text";
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
export const cardInteractive = "mk-btn hover:bg-surface-2";
export function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}
