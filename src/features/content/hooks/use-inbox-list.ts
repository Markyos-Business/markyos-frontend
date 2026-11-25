"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import { useRequest } from "@/hooks/useRequest";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { errorText } from "@/lib/api/errorText";
import { saveBlob } from "@/lib/download";
import type { InboxQuery } from "../api/content.api";
import type { Paged } from "../types";
import { useContentLang } from "./use-content-lang";

// Until the first full page arrives, the size the server is assumed to use.
const DEFAULT_PAGE_SIZE = 25;

/**
 * One of the website's inbox lists (sign-ups, messages): topic, search and
 * page live in the URL, so a filtered view survives a reload or Back. The
 * page size is the server's: a page that has a next one is a full page.
 * Export downloads the server's CSV through the signed-in client, so the
 * token never goes in an address.
 */
export function useInboxList<T>({
  key,
  list,
  exportCsv,
  fileName,
}: {
  key: string;
  list: (q: InboxQuery) => Promise<Paged<T>>;
  exportCsv: (q: InboxQuery) => Promise<Blob>;
  fileName: string;
}) {
  const { c, lang } = useContentLang();
  const { showToast } = useToast();
  const filters = useUrlFilters({ topic: "", q: "" });
  const { values, page } = filters;
  const query: InboxQuery = { topic: values.topic, q: values.q, page };
  const request = useRequest(() => list(query), `${key}:${values.topic}:${values.q}:${page}`);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const data = request.data;
  if (data?.next && data.results.length > 0 && data.results.length !== pageSize) setPageSize(data.results.length);

  // The search box keeps its own text while typing; remounting it empties it on Clear.
  const [searchKey, setSearchKey] = useState(0);
  const [searchSeed, setSearchSeed] = useState(values.q);
  const filtered = !!values.topic || !!values.q;
  const clearFilters = () => {
    filters.setMany({ topic: "", q: "" });
    setSearchSeed("");
    setSearchKey((k) => k + 1);
  };

  const [exporting, setExporting] = useState(false);
  async function download() {
    setExporting(true);
    try {
      saveBlob(await exportCsv({ topic: values.topic, q: values.q }), `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`);
      showToast(c.inbox.exported, "success");
    } catch (e: unknown) {
      showToast(errorText(e, lang), "danger");
    } finally {
      setExporting(false);
    }
  }

  /** After a delete: the last row of a later page steps back a page, so the table never lands empty. */
  const afterRemove = () => {
    if (page > 1 && (data?.results.length ?? 0) <= 1) filters.setPage(page - 1);
    else request.reload();
  };

  return {
    values,
    setTopic: (topic: string) => filters.set("topic", topic),
    setSearch: (q: string) => filters.set("q", q),
    filtered,
    clearFilters,
    searchKey,
    searchSeed,
    request,
    rows: data?.results,
    afterRemove,
    download,
    exporting,
    paging: { page, pageSize, total: data?.count ?? 0, onPageChange: filters.setPage },
  };
}
