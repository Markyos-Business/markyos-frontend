"use client";

import { useCurrentAccount } from "@/contexts/AppContext";
import { useRequest } from "@/hooks/useRequest";
import { getUser } from "../../services/adminService";
import type { Viewer } from "../../utils/rules";

/**
 * The signed-in admin as the rules need them: their id, and whether they're a
 * superuser (which the session doesn't carry). Until that loads they count as
 * not one, so a superuser-only action stays disabled a moment longer, never
 * the other way round.
 */
export function useAdminViewer(): Viewer {
  const account = useCurrentAccount();
  const id = account?.id ?? "";
  const me = useRequest(() => getUser(id), `viewer:${id}`);
  return { id, isSuperuser: !!me.data?.isSuperuser };
}
