"use client";

import { IconButton } from "@/components/ui";
import { HELP_SCREENS, type HelpScreen } from "../../help-map";
import { useHelpCopy } from "../../hooks/use-help-copy";
import { useHelpPanel } from "./help-panel-provider";

/** The ? on a screen: opens the Help panel on that screen's article (help-map.ts). */
export function HelpButton({ screen }: { screen: HelpScreen }) {
  const { h } = useHelpCopy();
  const panel = useHelpPanel();
  if (!panel) return null;
  return <IconButton icon="question-circle" label={h.panel.openFor} onClick={() => panel.openHelp(HELP_SCREENS[screen])} />;
}
