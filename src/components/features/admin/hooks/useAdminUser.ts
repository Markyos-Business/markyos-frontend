"use client";

import { ApiError } from "@/lib/api/client";
import { useRequest } from "@/hooks/useRequest";
import { getUser } from "../services/adminService";

/** One account. `data.user` is null when there's no such account: a 404 is an answer, not an error. */
export function useAdminUser(id: string) {
  return useRequest(
    () =>
      getUser(id).then(
        (user) => ({ user }),
        (err: unknown) => (err instanceof ApiError && err.status === 404 ? { user: null } : Promise.reject(err))
      ),
    `user:${id}`
  );
}
