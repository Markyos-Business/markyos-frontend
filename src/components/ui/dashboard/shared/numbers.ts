/** Charts represent nonnegative finite counts; invalid inputs cannot enter CSS/SVG. */
export const safeCount = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
export const percent = (value: number) => Math.min(100, safeCount(value));
