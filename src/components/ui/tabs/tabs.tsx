"use client";
import * as Primitive from "@radix-ui/react-tabs";
import { usePhoneViewport } from "@/hooks/useNarrowViewport";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactElement, Ref } from "react";
import { TabsContext, type RegisteredTab, type TabData, type TabItem, type TabsSize, type TabsVariant } from "./tabs-context";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { TabsContent } from "./tabs-content";
import { tabButtonId } from "./tab-navigation";
export type { TabData, TabItem, TabsSize, TabsVariant } from "./tabs-context";
export interface TabsRootProps extends Omit<Primitive.TabsProps, "value" | "defaultValue" | "onValueChange" | "onChange"> {
  tabs?: never;
  active?: never;
  onChange?: never;
  panelId?: never;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  fill?: boolean;
  activationMode?: "automatic" | "manual";
  mobileAs?: "select" | "scroll";
  items?: readonly TabData[];
  label?: string;
  keepMounted?: boolean;
  onBeforeChange?: (next: string, previous: string) => boolean | Promise<boolean>;
  onChangeError?: (error: unknown) => void;
  changeErrorText?: string;
}
export interface LegacyTabsProps<T extends string = string> {
  tabs: TabItem<T>[]; active: T; onChange: (key: T) => void; label: string;
  variant?: TabsVariant; className?: string; id: string; panelId: string;
  orientation?: "horizontal" | "vertical";
}
export type TabsProps<T extends string = string> = TabsRootProps | LegacyTabsProps<T>;
export const TabsRoot = forwardRef<HTMLDivElement, TabsRootProps>(function TabsRoot({ value: controlled, defaultValue, onValueChange, onBeforeChange, onChangeError, changeErrorText = "Could not change tab", variant = "underline", size = "md", fill = false, mobileAs, orientation: direction, dir, items, label = "Sections", keepMounted, children, className = "", id: providedId, ...props }, ref) {
  const generated = useId();
  const id = providedId ?? generated;
  const [local, setLocal] = useState(defaultValue ?? items?.find(item => !item.disabled && !item.disabledReason)?.id ?? "");
  const value = controlled ?? local;
  const current = useRef(value); current.current = value;
  const [tabs, setTabs] = useState<RegisteredTab[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const serial = useRef(0);
  const refusedFocus = useRef<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const isControlled = controlled !== undefined;
  const register = useCallback((tab: RegisteredTab) => {
    setTabs(previous => [...previous.filter(item => item.value !== tab.value), tab]);
    if (!tab.disabled && !isControlled && defaultValue === undefined) setLocal(previous => previous || tab.value);
    return () => setTabs(previous => previous.filter(item => item.value !== tab.value));
  }, [isControlled, defaultValue]);
  const inFlight = useRef<{ value: string; promise: Promise<boolean> } | null>(null);
  const change = useCallback(async (next: string) => {
    if (next === current.current) return true;
    if (tabs.find(tab => tab.value === next)?.disabled) return false;
    const token = ++serial.current;
    const previous = current.current;
    setPending(true); setError("");
    try {
      if (onBeforeChange && !(await onBeforeChange(next, previous))) { if (serial.current === token) refusedFocus.current = next; return false; }
      if (!mounted.current || serial.current !== token || current.current !== previous) return false;
      if (controlled === undefined) setLocal(next);
      onValueChange?.(next);
      return true;
    } catch (failure) {
      if (mounted.current && serial.current === token) { setError(changeErrorText); onChangeError?.(failure); }
      return false;
    } finally { if (mounted.current && serial.current === token) setPending(false); }
  }, [tabs, onBeforeChange, controlled, onValueChange, changeErrorText, onChangeError]);
  const request = useCallback((next: string) => {
    if (inFlight.current?.value === next) return inFlight.current.promise;
    const promise = change(next);
    inFlight.current = { value: next, promise };
    void promise.finally(() => { if (inFlight.current?.promise === promise) inFlight.current = null; });
    return promise;
  }, [change]);
  const phone = usePhoneViewport();
  const orientation = direction ?? (variant === "vertical" && !(phone && mobileAs === "scroll") ? "vertical" : "horizontal");
  const [inheritedDir, setInheritedDir] = useState<"ltr" | "rtl">("ltr");
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const read = () => { if (root.current) setInheritedDir(getComputedStyle(root.current.parentElement ?? root.current).direction === "rtl" ? "rtl" : "ltr"); };
    read();
    const observer = new MutationObserver(read);
    for (let element: HTMLElement | null = root.current; element; element = element.parentElement) observer.observe(element, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);
  return <TabsContext.Provider value={{ id, value, variant, size, fill, orientation, dir: dir ?? inheritedDir, mobileAs, pending, refusedFocus, request, register, tabs }}>
    <Primitive.Root {...props} id={id} ref={(node) => { root.current = node; if (typeof ref === "function") ref(node); else if (ref) ref.current = node; }} value={value} onValueChange={next => void request(next)} orientation={orientation} dir={dir ?? inheritedDir} aria-busy={pending || undefined} data-family-variant={variant} data-mobile-as={mobileAs} className={`mk-tabs-family min-w-0 ${orientation === "vertical" ? "flex gap-4" : ""} ${className}`}>
      {items ? <><TabsList label={label}>{items.map(({ id: itemId, content: _content, load: _load, ...item }, index) => { void [_content, _load]; return <TabsTrigger key={itemId} value={itemId} {...item} position={index + 1} total={items.length}>{item.label}</TabsTrigger>; })}</TabsList>{items.map(item => <TabsContent key={item.id} value={item.id} keepMounted={keepMounted} load={item.load}>{item.content}</TabsContent>)}</> : children}
      <span role="status" className="sr-only">{error}</span>
    </Primitive.Root>
  </TabsContext.Provider>;
});
const TabsImplementation = forwardRef<HTMLDivElement, TabsProps>(function TabsImplementation(props, ref) {
  if (!props.tabs) return <TabsRoot {...props} ref={ref} />;
  const { tabs, active, onChange, label, variant = "text", className, id, panelId, orientation } = props;
  return <TabsRoot ref={ref} value={active} onValueChange={onChange} variant={variant} id={`${id}-root`} orientation={orientation}>
    <TabsList id={id} label={label} className={className}>
      {tabs.map(({ key, ...item }, index) => <TabsTrigger key={key} value={key} id={tabButtonId(id, key)} aria-controls={panelId} {...item} position={index + 1} total={tabs.length}>{item.label}</TabsTrigger>)}
    </TabsList>
  </TabsRoot>;
});
/** Legacy generic keys remain inferred at existing call sites. */
export const Tabs = TabsImplementation as {
  (props: TabsRootProps & { ref?: Ref<HTMLDivElement> }): ReactElement;
  <T extends string>(props: LegacyTabsProps<T> & { ref?: Ref<HTMLDivElement> }): ReactElement;
};
