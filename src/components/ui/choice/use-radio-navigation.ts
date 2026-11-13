"use client";

import { useRef, type KeyboardEvent } from "react";

type RadioItem<V extends string> = { value: V; disabled?: boolean };

/**
 * Keyboard for a group of `role="radio"` buttons, the way native radios
 * behave: the group is one Tab stop (the chosen option, or the first), and
 * the arrow keys move the choice. Down and the reading-forward arrow go next,
 * Up and the reading-back arrow go back, so it mirrors in Arabic; Home and
 * End go to the ends; disabled options are skipped and it wraps.
 */
function useRadioNavigation<V extends string>({ items, value, onChange }: { items: readonly RadioItem<V>[]; value: V | null; onChange: (value: V) => void }) {
  const group = useRef<HTMLDivElement>(null);
  const enabled = items.filter((i) => !i.disabled);
  const stop = enabled.find((i) => i.value === value)?.value ?? enabled[0]?.value;

  function onKeyDown(event: KeyboardEvent<HTMLElement>, current: V) {
    if (event.altKey || event.ctrlKey || event.metaKey || !group.current || !enabled.length) return;
    const rtl = getComputedStyle(group.current).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const at = enabled.findIndex((i) => i.value === current);
    let next: V | undefined;
    if (event.key === "Home") next = enabled[0].value;
    else if (event.key === "End") next = enabled[enabled.length - 1].value;
    else if (event.key === "ArrowDown" || event.key === forward) next = enabled[(at + 1) % enabled.length].value;
    else if (event.key === "ArrowUp" || event.key === back) next = enabled[(at - 1 + enabled.length) % enabled.length].value;
    else if (event.key === " " || event.key === "Enter") next = current;
    if (next === undefined) return;
    event.preventDefault();
    const target = group.current.querySelector<HTMLElement>(`[role="radio"][data-value="${CSS.escape(next)}"]`);
    target?.focus();
    if (next !== value) onChange(next);
  }

  /** Spread on each radio: its value, roving tabindex and key handling. */
  const radioProps = (item: RadioItem<V>) => ({
    role: "radio" as const,
    "data-value": item.value,
    "aria-checked": item.value === value,
    "aria-disabled": item.disabled || undefined,
    tabIndex: item.value === stop ? 0 : -1,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKeyDown(e, item.value),
  });

  return { group, radioProps };
}

export { useRadioNavigation };
