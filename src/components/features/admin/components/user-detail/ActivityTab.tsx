"use client";

import { ActivityFeed, ContentCard, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useAdminLang } from "../../hooks/shared/useAdminLang";
import type { UserPage } from "../../hooks/user-detail/useUserPage";
import { describeActivity } from "../../utils/activity";

/** What happened on the account, newest first. */
export function ActivityTab({ activity }: { activity: UserPage["activity"] }) {
  const { c, lang } = useAdminLang();
  return (
    <ContentCard title={c.activity.title}>
      {activity.error ? (
        <ErrorState message={activity.error} onRetry={activity.reload} />
      ) : !activity.data ? (
        <div className="flex flex-col gap-space-5" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : activity.data.length === 0 ? (
        <EmptyState icon="history" title={c.activity.emptyTitle} description={c.activity.emptyBody} />
      ) : (
        <ActivityFeed items={activity.data.map((item) => describeActivity(item, c, lang))} />
      )}
    </ContentCard>
  );
}
