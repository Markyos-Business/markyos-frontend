"use client";

import { useRequest } from "@/hooks/useRequest";
import { listLibrary } from "../services/discoveryService";
import type { LibraryQuery } from "../types";

export function useLibrary(query: LibraryQuery) {
  return useRequest(() => listLibrary(query), JSON.stringify(query));
}
