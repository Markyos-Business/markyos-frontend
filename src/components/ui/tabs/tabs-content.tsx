"use client";
import * as Primitive from "@radix-ui/react-tabs";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../button";
import { EmptyState } from "../empty-state";
import { useTabsFamily, tabContentId } from "./tabs-context";
import { tabButtonId } from "./tab-navigation";
export interface TabsContentProps extends Primitive.TabsContentProps {
  keepMounted?: boolean; loading?: boolean; load?: (signal: AbortSignal) => Promise<ReactNode>;
  loadingText?: string; errorText?: string; retryLabel?: string; emptyTitle?: string; emptyDescription?: string;
}
function LazyBody({ load, loadingText, errorText, retryLabel, emptyTitle, emptyDescription }: Required<Pick<TabsContentProps, "load" | "loadingText" | "errorText" | "retryLabel" | "emptyTitle" | "emptyDescription">>) {
  const loader = useRef(load);
  const [result, setResult] = useState<{ data?: ReactNode; error?: boolean; loading: boolean }>({ loading: true });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start/retry an external asynchronous load
    setResult({ loading: true });
    Promise.resolve().then(() => loader.current(abort.signal)).then(data => { if (!abort.signal.aborted) setResult({ data, loading: false }); }, () => { if (!abort.signal.aborted) setResult({ error: true, loading: false }); });
    return () => abort.abort();
  }, [retry]);
  if (result.loading) return <div role="status" aria-busy="true" className="py-4 text-body text-text-muted">{loadingText}<div aria-hidden="true" className="mt-3 h-4 w-32 rounded-sm bg-ink-soft" /></div>;
  if (result.error) return <div role="alert" className="flex items-center gap-3 py-4 text-body text-danger">{errorText}<Button onClick={() => setRetry(value => value + 1)}>{retryLabel}</Button></div>;
  return result.data ?? <EmptyState icon="file-alt" title={emptyTitle} description={emptyDescription} />;
}
export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent({ value, keepMounted, forceMount, loading, load, loadingText = "Loading content", errorText = "Could not load content", retryLabel = "Try again", emptyTitle = "No content", emptyDescription = "Content will appear here.", children, className = "", ...props }, ref) {
  const family = useTabsFamily();
  const selected = family.value === value;
  const [visited, setVisited] = useState(selected);
  if (selected && !visited) setVisited(true);
  return <Primitive.Content {...props} ref={ref} value={value} id={props.id ?? tabContentId(family.id, value)} aria-labelledby={props["aria-labelledby"] ?? tabButtonId(family.id, value)} forceMount={forceMount || (keepMounted && (visited || selected)) ? true : undefined} hidden={!selected} aria-busy={loading || undefined} className={`mk-family-tabpanel min-w-0 flex-1 rounded-lg p-4 text-body text-text outline-none ${className}`}>
    {loading ? <div role="status" className="text-text-muted">{loadingText}</div> : load ? <LazyBody load={load} loadingText={loadingText} errorText={errorText} retryLabel={retryLabel} emptyTitle={emptyTitle} emptyDescription={emptyDescription} /> : children ?? <EmptyState icon="file-alt" title={emptyTitle} description={emptyDescription} />}
  </Primitive.Content>;
});
