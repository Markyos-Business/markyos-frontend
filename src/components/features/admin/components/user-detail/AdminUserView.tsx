"use client";

import { Button, EmptyState, ErrorState, Icon, Skeleton, Tabs } from "@/components/ui";
import { USER_TABS } from "../../constants";
import { useAdminLang } from "../../hooks/shared/useAdminLang";
import { useUserPage } from "../../hooks/user-detail/useUserPage";
import { ChangeRoleDialog } from "../shared/ChangeRoleDialog";
import { ActivityTab } from "./ActivityTab";
import { OverviewTab } from "./OverviewTab";
import { PermissionsTab } from "./PermissionsTab";
import { SessionsTab } from "./SessionsTab";
import { UserHeader } from "./UserHeader";

const TAB_ICONS = { overview: "user", activity: "history", permissions: "user-shield", sessions: "laptop" } as const;

/** One account: who they are, what happened, what their role allows, and where they're signed in. */
export function AdminUserView({ id }: { id: string }) {
  const { c } = useAdminLang();
  const page = useUserPage(id);
  const { user, actions } = page;
  const back = (
    <Button variant="link" href="/admin/users" icon={<Icon name="arrow-left" size={16} className="rtl:-scale-x-100" />}>
      {c.detail.back}
    </Button>
  );

  if (page.notFound) {
    return (
      <>
        {back}
        <EmptyState icon="user-slash" title={c.detail.notFound} description={c.empty.noMatchBody} action={back} />
      </>
    );
  }
  if (user.error && !user.data) {
    return (
      <>
        {back}
        <ErrorState message={user.error} onRetry={user.reload} />
      </>
    );
  }
  if (!page.account || !page.rules) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true">
        {back}
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-10 w-96 max-w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  const account = page.account;
  return (
    <>
      {/* The person's name is the page's heading, in the header card. */}
      <nav aria-label={c.breadcrumb}>{back}</nav>
      <UserHeader user={account} rules={page.rules} actions={actions} />

      <Tabs
        label={c.detail.tabsLabel}
        active={page.tab}
        onChange={page.setTab}
        tabs={USER_TABS.map((key) => ({ key, label: c.detail.tabs[key], icon: TAB_ICONS[key] }))}
      />

      <div key={page.tab}>
        {page.tab === "overview" && <OverviewTab user={account} sessionCount={page.sessions.data?.length ?? null} />}
        {page.tab === "activity" && <ActivityTab activity={page.activity} />}
        {page.tab === "permissions" && <PermissionsTab user={account} />}
        {page.tab === "sessions" && <SessionsTab user={account} sessions={page.sessions} actions={actions} />}
      </div>

      {actions.roleFor && (
        <ChangeRoleDialog
          open
          title={c.roleDialog.title(actions.roleFor.name)}
          initial={actions.roleFor.role}
          onClose={() => actions.setRoleFor(null)}
          onSubmit={(role) => actions.changeRole(actions.roleFor!, role)}
        />
      )}
    </>
  );
}
