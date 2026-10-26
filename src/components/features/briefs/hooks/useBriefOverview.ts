"use client";

import { useRequest } from "@/hooks/useRequest";
import { getOverview } from "../services/briefsService";

export function useBriefOverview(brandId: string) {
  return useRequest(() => getOverview(brandId), brandId);
}
