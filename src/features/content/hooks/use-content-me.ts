"use client";

import { useRequest } from "@/hooks/useRequest";
import { getMe } from "../api/content.api";

/** What the signed-in person can do with website content. */
export function useContentMe() {
  return useRequest(getMe, "content-me");
}
