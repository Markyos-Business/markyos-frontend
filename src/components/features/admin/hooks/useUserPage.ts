"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { USER_TABS } from "../constants";
import { rulesFor } from "../utils/rules";
import { useAdminStats } from "./useAdminStats";
import { useAdminUser } from "./useAdminUser";
import { useAdminViewer } from "./useAdminViewer";
import { useUserActions } from "./useUserActions";
import { useUserActivity } from "./useUserActivity";
import { useUserSessions } from "./useUserSessions";

type UserTab = (typeof USER_TABS)[number];

/** One account's page: the account, its tab (kept in the URL), and everything an admin can do to it. */
export function useUserPage(id: string) {
  const router = useRouter();
  const user = useAdminUser(id);
  const stats = useAdminStats();
  const viewer = useAdminViewer();
  // Bumped after every change, so the history and sessions fetch again.
  const [version, setVersion] = useState(0);
  const refresh = () => {
    user.reload();
    stats.reload();
    setVersion((v) => v + 1);
  };
  const actions = useUserActions((changed) => (changed ? refresh() : router.replace("/admin/users")));
  const sessions = useUserSessions(id, version, refresh);
  const activity = useUserActivity(id, version);

  const tabs = useUrlFilters({ tab: "overview" });
  const tab = (USER_TABS as readonly string[]).includes(tabs.values.tab) ? (tabs.values.tab as UserTab) : "overview";

  const account = user.data?.user ?? null;
  const notFound = user.data !== null && account === null;
  const rules = account ? rulesFor(account, viewer, stats.data?.users.activeAdmins ?? 1) : null;

  return {
    user,
    account,
    notFound,
    rules,
    actions,
    sessions,
    activity,
    tab,
    setTab: (next: UserTab) => tabs.set("tab", next),
  };
}

export type UserPage = ReturnType<typeof useUserPage>;
