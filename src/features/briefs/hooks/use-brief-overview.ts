"use client";

import { useRequest } from "@/hooks/useRequest";
import { getOverview } from "../api/briefs.api";

export function useBriefOverview(brandId: string) {
  return useRequest(() => getOverview(brandId), brandId);
}
