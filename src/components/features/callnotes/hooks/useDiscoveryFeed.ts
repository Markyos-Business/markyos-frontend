"use client";

import { useRequest } from "@/hooks/useRequest";
import { getFeed } from "../services/callNotesService";

export function useDiscoveryFeed(brandId: string) {
  return useRequest(() => getFeed(brandId), brandId);
}
