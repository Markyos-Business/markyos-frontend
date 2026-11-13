"use client";

import { SearchField } from "@/components/ui";
import { AccountHeader } from "@/features/shell";
import type { BRANDS_COPY } from "../../copy";

export function BrandsHeader({ query, onQuery, c }: { query: string; onQuery: (query: string) => void; c: (typeof BRANDS_COPY)["en"] }) {
  return <AccountHeader search={<SearchField fullWidth label={c.search} placeholder={c.searchPlaceholder} value={query} onChange={event => onQuery(event.target.value)} />} />;
}
