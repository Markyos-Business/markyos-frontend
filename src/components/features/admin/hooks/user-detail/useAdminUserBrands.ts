"use client";

import { useRequest } from "@/hooks/useRequest";
import { listUserBrands } from "../../services/adminService";

export function useAdminUserBrands(userId: string) {
  return useRequest(() => listUserBrands(userId), userId);
}
