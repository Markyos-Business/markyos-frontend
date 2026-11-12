"use client";

import { useId, type HTMLAttributes } from "react";
import { tabButtonId } from "./tabNavigation";

/** Share these IDs between Tabs and its separately placed, changing panel. */
export function useTabIds() {
  const id = useId();
  return { id, panelId: `${id}-panel` };
}

type TabPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "id" | "role" | "aria-labelledby"> & {
  id: string; tabsId: string; active: string | number;
};

export function TabPanel({ id, tabsId, active, tabIndex = 0, ...props }: TabPanelProps) {
  return <div {...props} id={id} role="tabpanel" aria-labelledby={tabButtonId(tabsId, active)} tabIndex={tabIndex} />;
}
