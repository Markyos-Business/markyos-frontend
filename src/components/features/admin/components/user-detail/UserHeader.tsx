"use client";

import { ActionsDropdown, Avatar, Button, ContentCard, Icon, StatusDot, Tag } from "@/components/ui";
import { STATUS_TONE } from "../../constants";
import { useAdminLang } from "../../hooks/shared/useAdminLang";
import type { UserActions } from "../../hooks/shared/useUserActions";
import type { AdminUser } from "../../types";
import { initialsOf } from "../../utils/format";
import type { Rule, UserRules } from "../../utils/rules";

type UserHeaderProps = { user: AdminUser; rules: UserRules; actions: UserActions };

/** Who the account is, where it stands, and what an admin can do to it. */
export function UserHeader({ user, rules, actions }: UserHeaderProps) {
  const { c } = useAdminLang();
  const reason = (rule: Rule) => (rule.allowed ? undefined : c.reasons[rule.reason]);

  return (
    <ContentCard>
      <div className="flex flex-col gap-space-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-space-6">
        <Avatar initials={initialsOf(user.name || user.email)} src={user.avatarUrl} size={56} tone={user.isAdmin ? "accent" : "muted"} />
        <div className="flex min-w-0 flex-col gap-space-2">
          <h1 dir="auto" className="truncate text-h3 font-medium text-text">
            {user.name}
          </h1>
          <div dir="ltr" className="truncate text-start text-caption text-text-muted">
            {user.email}
          </div>
          <div className="flex flex-wrap items-center gap-space-5 pt-space-2">
            <Tag tone={user.isAdmin ? "primary" : "neutral"}>{c.roles[user.role]}</Tag>
            <StatusDot tone={STATUS_TONE[user.status]} label={c.statuses[user.status]} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-space-4">
        {user.status === "waiting" && (
          <Button variant="outline" size="sm" icon={<Icon name="envelope" size={16} />} onClick={() => actions.resend(user)}>
            {c.actions.resend}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          icon={<Icon name="user-shield" size={16} />}
          disabledReason={reason(rules.changeRole)}
          onClick={() => actions.setRoleFor(user)}
        >
          {c.actions.changeRole}
        </Button>
        {user.isActive ? (
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="user-slash" size={16} />}
            disabledReason={reason(rules.deactivate)}
            onClick={() => actions.deactivate(user)}
          >
            {c.actions.deactivate}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            icon={<Icon name="user-check" size={16} />}
            disabledReason={reason(rules.reactivate)}
            onClick={() => actions.reactivate(user)}
          >
            {c.actions.reactivate}
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          icon={<Icon name="trash" size={16} />}
          disabledReason={reason(rules.remove)}
          onClick={() => actions.remove(user)}
        >
          {c.actions.remove}
        </Button>
        <ActionsDropdown
          iconOnly
          label={c.actions.more}
          items={[{ label: c.actions.signOutAll, icon: "sign-out-alt", tone: "danger", onSelect: () => actions.signOutEverywhere(user) }]}
        />
      </div>
      </div>
    </ContentCard>
  );
}
