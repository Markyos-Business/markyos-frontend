"use client";

import { useRequest } from "@/hooks/useRequest";
import { listArticles } from "../api/content.api";
import type { ContentKind } from "../types";

/** The articles this person can open, optionally one section only. */
export function useArticles(kind?: ContentKind) {
  return useRequest(() => listArticles(kind), `content-articles-${kind ?? "all"}`);
}
