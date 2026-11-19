"use client";

import { useId, type HTMLAttributes } from "react";
import { tabButtonId } from "./tab-navigation";

/** Share these IDs between Tabs and its separately placed, changing panel. */
export function useTabIds() {
  const id = useId();
  return { id, panelId: `${id}-panel` };
}

type TabPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "id" | "role" | "aria-labelledby"> & {
  id: string; tabsId: string; active: string | number;
};

/**
 * Focusable by default, so a panel of plain text is reachable by keyboard.
 * Pass `tabIndex={-1}` when the panel wraps a whole page of controls: those
 * are the tab stops, and a focusable page draws the focus ring around itself.
 */
export function TabPanel({ id, tabsId, active, tabIndex = 0, ...props }: TabPanelProps) {
  return <div {...props} id={id} role="tabpanel" aria-labelledby={tabButtonId(tabsId, active)} tabIndex={tabIndex} />;
}
