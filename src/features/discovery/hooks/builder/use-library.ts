"use client";

import { useRequest } from "@/hooks/useRequest";
import { listLibrary } from "../../api/discovery.api";
import type { LibraryQuery } from "../../types";

export function useLibrary(query: LibraryQuery) {
  return useRequest(() => listLibrary(query), JSON.stringify(query));
}
