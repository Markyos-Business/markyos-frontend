"use client";

import { SearchField } from "@/components/form";
import { AccountHeader } from "@/components/layout/AccountHeader";
import type { BRANDS_COPY } from "../../copy";

export function BrandsHeader({ query, onQuery, c }: { query: string; onQuery: (query: string) => void; c: (typeof BRANDS_COPY)["en"] }) {
  return <AccountHeader search={<SearchField label={c.search} placeholder={c.searchPlaceholder} value={query} onChange={event => onQuery(event.target.value)} />} />;
}
