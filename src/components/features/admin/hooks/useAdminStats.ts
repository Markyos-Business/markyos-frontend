"use client";

import { useRequest } from "@/hooks/useRequest";
import { getStats } from "../services/adminService";

export function useAdminStats() {
  return useRequest(getStats, "stats");
}
