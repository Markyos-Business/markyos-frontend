"use client";

import { useRequest } from "@/hooks/useRequest";
import { getUserActivity } from "../../api/admin.api";

export function useUserActivity(id: string, version: number) {
  return useRequest(() => getUserActivity(id), `activity:${id}:${version}`);
}
