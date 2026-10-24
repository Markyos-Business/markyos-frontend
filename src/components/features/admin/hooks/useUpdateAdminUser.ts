"use client";

import { useState } from "react";
import { updateUser } from "../services/adminService";
import type { AdminUser, AdminUserPatch } from "../types";

/** Change an account's role or status. Resolves to the updated account. */
export function useUpdateAdminUser() {
  const [busy, setBusy] = useState(false);
  async function update(id: string, patch: AdminUserPatch): Promise<AdminUser> {
    setBusy(true);
    try {
      return await updateUser(id, patch);
    } finally {
      setBusy(false);
    }
  }
  return { update, busy };
}
