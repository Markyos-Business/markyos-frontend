"use client";

import { useRequest } from "@/hooks/useRequest";
import { listUsers } from "../../api/admin.api";
import type { AdminUserQuery } from "../../types";

export function useAdminUsers(query: AdminUserQuery) {
  return useRequest(() => listUsers(query), JSON.stringify(query));
}
