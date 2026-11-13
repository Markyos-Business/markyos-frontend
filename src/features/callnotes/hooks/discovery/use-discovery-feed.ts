"use client";

import { useRequest } from "@/hooks/useRequest";
import { getFeed } from "../../api/call-notes.api";

export function useDiscoveryFeed(brandId: string) {
  return useRequest(() => getFeed(brandId), brandId);
}
