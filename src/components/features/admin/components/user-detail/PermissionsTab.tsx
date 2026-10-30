"use client";

import { ContentCard, KeyValueList, StatusDot } from "@/components/ui";
import { ROLE_PERMISSIONS } from "../../constants";
import { useAdminLang } from "../../hooks/shared/useAdminLang";
import type { AdminUser } from "../../types";

/** What the account's role may do. Read-only: Change role is where it changes. */
export function PermissionsTab({ user }: { user: AdminUser }) {
  const { c } = useAdminLang();
  const p = c.permissions;
  // A superuser is an admin whatever their role says.
  const role = user.isAdmin ? "admin" : "member";
  return (
    <ContentCard title={p.title(c.roles[role])} footer={<p className="text-caption text-text-muted">{p.note}</p>}>
      <KeyValueList
        items={(Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]).map((key) => {
          const allowed = ROLE_PERMISSIONS[key][role];
          return {
            label: p.items[key],
            value: <StatusDot tone={allowed ? "success" : "neutral"} label={allowed ? p.allowed : p.notAllowed} />,
          };
        })}
      />
    </ContentCard>
  );
}
