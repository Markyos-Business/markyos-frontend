"use client";

import { useState } from "react";
import { revokeUserSessions } from "../services/adminService";

/** Sign an account out on every device. */
export function useRevokeUserSessions() {
  const [busy, setBusy] = useState(false);
  async function revoke(id: string): Promise<void> {
    setBusy(true);
    try {
      await revokeUserSessions(id);
    } finally {
      setBusy(false);
    }
  }
  return { revoke, busy };
}
