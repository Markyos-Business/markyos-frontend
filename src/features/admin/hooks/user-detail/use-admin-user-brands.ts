"use client";

import { useRequest } from "@/hooks/useRequest";
import { listUserBrands } from "../../api/admin.api";

export function useAdminUserBrands(userId: string) {
  return useRequest(() => listUserBrands(userId), userId);
}
