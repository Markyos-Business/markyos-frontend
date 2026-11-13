"use client";

import { useRequest } from "@/hooks/useRequest";
import { getStats } from "../../api/admin.api";

export function useAdminStats() {
  return useRequest(getStats, "stats");
}
