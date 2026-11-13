"use client";

import { useRef, type KeyboardEvent } from "react";
import { nextTabKey, type TabOption, type TabOrientation } from "./tab-navigation";

/** Automatic activation: these panels update locally when selection changes. */
export function useTabNavigation<Key extends string | number>({ tabs, active, onChange, orientation = "horizontal" }: {
  tabs: readonly TabOption<Key>[]; active: Key; onChange: (key: Key) => void; orientation?: TabOrientation;
}) {
  const row = useRef<HTMLDivElement>(null);
  const entry = tabs.find((tab) => tab.key === active && !tab.disabled)?.key ?? tabs.find((tab) => !tab.disabled)?.key;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: Key) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !row.current) return;
    const direction = getComputedStyle(row.current).direction === "rtl" ? "rtl" : "ltr";
    const next = nextTabKey(tabs, key, event.key, direction, orientation);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    const buttons = Array.from(row.current.querySelectorAll<HTMLButtonElement>('button[role="tab"]'))
      .filter((button) => button.closest('[role="tablist"]') === row.current);
    const target = buttons[tabs.findIndex((tab) => tab.key === next)];
    target?.focus();
    target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    if (next !== active) onChange(next);
  }

  return {
    row,
    tabProps: (key: Key) => ({
      tabIndex: key === entry ? 0 : -1,
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, key),
    }),
  };
}
