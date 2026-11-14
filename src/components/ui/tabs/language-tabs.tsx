"use client";
import { forwardRef } from "react";
import type { ReactNode } from "react";
import { TabsRoot, type TabsRootProps } from "./tabs";
import type { TabLabels } from "./tabs-context";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { TabsContent } from "./tabs-content";
export interface LanguageTabsProps extends Omit<TabsRootProps, "children" | "items"> { english: ReactNode; arabic: ReactNode; arabicValue?: string; label?: string; triggerLabels?: TabLabels; englishLabel?: string; arabicLabel?: string; needsArabicLabel?: string; }
export const LanguageTabs = forwardRef<HTMLDivElement, LanguageTabsProps>(function LanguageTabs({ english, arabic, arabicValue, label = "Content language", englishLabel = "EN", arabicLabel = "AR", needsArabicLabel = "Needs Arabic", triggerLabels, ...props }, ref) {
  const missing = arabicValue !== undefined && !arabicValue.trim();
  return <TabsRoot {...props} ref={ref} defaultValue={props.defaultValue ?? "en"}><TabsList label={label}>
    <TabsTrigger {...triggerLabels} value="en" position={1} total={2}>{englishLabel}</TabsTrigger>
    <TabsTrigger {...triggerLabels} value="ar" status={missing ? "warning" : undefined} warningLabel={needsArabicLabel} position={2} total={2}>{arabicLabel}{missing && <span className="text-caption text-warning">{needsArabicLabel}</span>}</TabsTrigger>
  </TabsList><TabsContent value="en" lang="en" dir="ltr" keepMounted>{english}</TabsContent><TabsContent value="ar" lang="ar" dir="rtl" keepMounted>{arabic}</TabsContent></TabsRoot>;
});
