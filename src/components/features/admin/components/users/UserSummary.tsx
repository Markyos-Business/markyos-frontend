import { Avatar, Badge, IconButton } from "@/components/ui";
import { ROLE_LABELS, ROLE_TONES, STATUS_LABELS, STATUS_TONES } from "../../constants";
import type { AdminUser } from "../../types";
import { formatDate, initialsOf } from "../../utils/format";

/** The drawer's head: who it is, their standing, and when they came and went. */
export function UserSummary({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const status = user.isActive ? "active" : "inactive";
  return (
    <>
      <div className="flex items-start gap-3">
        <Avatar initials={initialsOf(user.name)} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-h5 font-medium">{user.name}</h2>
          <p className="truncate text-caption text-text-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={ROLE_TONES[user.role]}>{user.isSuperuser ? "Superuser" : ROLE_LABELS[user.role]}</Badge>
            <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
            {user.twoFactorEnabled && <Badge>2FA on</Badge>}
          </div>
        </div>
        <IconButton icon="times" label="Close" onClick={onClose} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-caption">
        <div>
          <dt className="text-text-faint">Joined</dt>
          <dd className="font-medium">{formatDate(user.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-text-faint">Last signed in</dt>
          <dd className="font-medium">{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</dd>
        </div>
      </dl>
    </>
  );
}
