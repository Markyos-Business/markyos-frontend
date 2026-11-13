"use client";
import { useEffect, useState } from "react";
import { NativeSelect } from "./NativeSelect";
import { useNativeTouch } from "./SelectParts";
import { SearchSelect } from "./SearchSelect";
import type { AsyncSelectProps, SelectOption } from "./types";
export function AsyncSelect({ loadOptions, debounceMs = 250, ...props }: AsyncSelectProps) {
  const [query, setQuery] = useState(props.search ?? ""); const [own, setOwn] = useState(props.defaultValue ?? "");
  const [cache, setCache] = useState<SelectOption[]>([]); const [result, setResult] = useState<{ options: readonly SelectOption[]; loading: boolean; error: boolean; query: string }>({ options: [], loading: true, error: false, query: props.search ?? "" });
  const native = useNativeTouch(props.useNative);
  const [retry, setRetry] = useState(0); const search = props.search ?? query; const value = props.value ?? own;
  useEffect(() => {
    const controller = new AbortController(); let live = true;
    const timer = setTimeout(async () => {
      setResult(prev => ({ ...prev, query: search, loading: true, error: false }));
      try { const options = await loadOptions(search, { signal: controller.signal }); if (!live) return; setResult({ options, loading: false, error: false, query: search }); setCache(prev => [...new Map([...prev, ...options].map(o => [o.value, o])).values()]); }
      catch { if (live) setResult(prev => ({ ...prev, loading: false, error: true })); }
    }, debounceMs);
    return () => { live = false; clearTimeout(timer); controller.abort(); };
  }, [loadOptions, search, debounceMs, retry]);
  const selected = cache.filter(o => o.value === value);
  if (native) return <NativeSelect {...props} options={result.options} value={value} onValueChange={next => { setOwn(next); props.onValueChange?.(next); }} />;
  return <SearchSelect {...props} remote options={result.options} selectedOptions={selected} values={value ? [value] : []}
    search={search} onSearchChange={next => { setQuery(next); props.onSearchChange?.(next); }} loading={result.loading || result.query !== search} loadError={result.error} onRetry={() => setRetry(n => n + 1)}
    onValuesChange={values => { setOwn(values[0] ?? ""); props.onValueChange?.(values[0] ?? ""); }} />;
}
