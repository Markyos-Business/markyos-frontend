import type { AdminUser } from "../types";

/** Why an action is off, as a key into the copy's `reasons`. */
export type RefusalReason = "self" | "selfRemove" | "lastAdmin" | "superuser";

export type Rule = { allowed: true } | { allowed: false; reason: RefusalReason };

export interface Viewer {
  id: string;
  isSuperuser: boolean;
}

const yes: Rule = { allowed: true };
const no = (reason: RefusalReason): Rule => ({ allowed: false, reason });

/**
 * What the signed-in admin may do to `target`, mirroring the server's guards
 * (`change_refusal`, `remove_refusal`) so a refused action is disabled with
 * its reason up front. The server still decides.
 */
export function rulesFor(target: AdminUser, viewer: Viewer, activeAdmins: number) {
  const protectedSuperuser = target.isSuperuser && !viewer.isSuperuser;
  const self = target.id === viewer.id;
  const lastAdmin = target.isAdmin && target.isActive && activeAdmins <= 1;

  // Losing admin access: demoting, deactivating or removing an admin.
  const losingAccess = (): Rule =>
    protectedSuperuser ? no("superuser") : self ? no("self") : lastAdmin ? no("lastAdmin") : yes;

  return {
    changeRole: target.isAdmin ? losingAccess() : protectedSuperuser ? no("superuser") : yes,
    deactivate: losingAccess(),
    reactivate: protectedSuperuser ? no("superuser") : yes,
    remove: self ? no("selfRemove") : losingAccess(),
    resend: target.status === "waiting" ? yes : no("self"),
  };
}

export type UserRules = ReturnType<typeof rulesFor>;
