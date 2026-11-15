"use client";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
export type TabsVariant = "underline" | "segmented" | "boxed" | "vertical" | "text" | "icon" | "pill";
export type TabsSize = "sm" | "md" | "lg";
export type TabStatus = "error" | "warning" | "success";
export interface RegisteredTab { value: string; label: string; disabled?: boolean; }
export interface TabsContextValue {
  id: string;
  value: string;
  variant: TabsVariant;
  size: TabsSize;
  fill: boolean;
  orientation: "horizontal" | "vertical";
  dir: "ltr" | "rtl";
  mobileAs?: "select" | "scroll";
  pending: boolean;
  refusedFocus: { current: string | null };
  request: (value: string) => Promise<boolean>;
  register: (tab: RegisteredTab) => () => void;
  tabs: RegisteredTab[];
}
export const TabsContext = createContext<TabsContextValue | null>(null);
export function useTabsFamily() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be inside Tabs.");
  return context;
}
export const tabContentId = (id: string, value: string) => `${id}-content-${encodeURIComponent(value)}`;
export interface TabLabels {
  countLabel?: string; unreadLabel?: string; unsavedLabel?: string; errorLabel?: string;
  warningLabel?: string; successLabel?: string; closeLabel?: string;
  positionLabel?: (position: number, total: number) => string;
}
export interface TabData extends TabLabels {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  unread?: boolean;
  status?: TabStatus;
  disabled?: boolean;
  disabledReason?: string;
  iconOnly?: boolean;
  closable?: boolean;
  onClose?: () => void;
  unsaved?: boolean;
  loading?: boolean;
  skeleton?: boolean;
  content?: ReactNode;
  load?: (signal: AbortSignal) => Promise<ReactNode>;
}
export type TabItem<T extends string = string> = { key: T; label: string; icon?: string; count?: number; disabled?: boolean; disabledReason?: string; status?: TabStatus; unread?: boolean; unsaved?: boolean };
