export type TabOption<Key extends string | number = string> = { key: Key; disabled?: boolean };
export type TabOrientation = "horizontal" | "vertical";

/** Visual arrows, logical Home/End, wrapping, and disabled-tab skipping. */
export function nextTabKey<Key extends string | number>(
  tabs: readonly TabOption<Key>[], current: Key, pressed: string,
  direction: "ltr" | "rtl" = "ltr", orientation: TabOrientation = "horizontal",
): Key | null {
  const enabled = tabs.filter((tab) => !tab.disabled);
  if (!enabled.length) return null;
  if (pressed === "Home") return enabled[0].key;
  if (pressed === "End") return enabled[enabled.length - 1].key;
  let step = 0;
  if (orientation === "vertical") {
    if (pressed === "ArrowDown") step = 1;
    if (pressed === "ArrowUp") step = -1;
  } else {
    if (pressed === "ArrowRight") step = direction === "rtl" ? -1 : 1;
    if (pressed === "ArrowLeft") step = direction === "rtl" ? 1 : -1;
  }
  if (!step) return null;
  const index = enabled.findIndex((tab) => tab.key === current);
  if (index < 0) return enabled[step > 0 ? 0 : enabled.length - 1].key;
  return enabled[(index + step + enabled.length) % enabled.length].key;
}

export const tabButtonId = (id: string, key: string | number) => `${id}-tab-${encodeURIComponent(String(key))}`;
