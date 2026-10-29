"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * A list's filters, kept in the URL's search params: a filtered view can be
 * shared, reloaded, or come back to with Back. `defaults` names every key and
 * its unfiltered value; a value equal to its default is left out of the URL.
 * Changing a filter drops `page`, so a new filter starts on page one.
 */
export function useUrlFilters<K extends string>(defaults: Record<K, string>) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const values = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults) as K[]) out[key] = params.get(key) ?? defaults[key];
    return out;
    // `defaults` is a literal at the call site; its content is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const write = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      const base: Record<string, string> = defaults;
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === base[key]) next.delete(key);
        else next.set(key, value);
      }
      if (!("page" in patch)) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, pathname, router]
  );

  const active = (Object.keys(defaults) as K[]).some((k) => values[k] !== defaults[k]);
  const clear = useCallback(() => write(Object.fromEntries(Object.keys(defaults).map((k) => [k, ""]))), [write, defaults]);
  const page = Math.max(1, Number(params.get("page")) || 1);

  return {
    values,
    page,
    active,
    clear,
    set: (key: K, value: string) => write({ [key]: value }),
    setPage: (p: number) => write({ page: String(p) }),
  };
}
