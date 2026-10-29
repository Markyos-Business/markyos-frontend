// Chart series in the spec's order (§6.15): accent, green, yellow, red, cyan,
// indigo — as theme tokens, so a chart switches with light and dark. Written
// out in full so Tailwind finds every class.
const SERIES_FILL = ["fill-accent", "fill-success", "fill-warning", "fill-danger-fill", "fill-info", "fill-indigo"];
const SERIES_STROKE = ["stroke-accent", "stroke-success", "stroke-warning", "stroke-danger-fill", "stroke-info", "stroke-indigo"];
const SERIES_BG = ["bg-accent", "bg-success", "bg-warning", "bg-danger-fill", "bg-info", "bg-indigo"];

export { SERIES_BG, SERIES_FILL, SERIES_STROKE };
