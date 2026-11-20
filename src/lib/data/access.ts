import type { Account, Session, TeamRole, Workspace } from "../../types";

/**
 * The signed-in person's role on a brand, or null when they have none.
 *
 * The owner is the account the brand belongs to; everyone else is whoever
 * the owner put on its team, matched by email. A client never receives the
 * team, so for them the role the server reported on load decides. The server
 * applies the same rule to every request, so this only decides what the app
 * shows and sends.
 */
export function roleOn(ws: Workspace, session: Session | null): TeamRole | null {
  if (!session) return null;
  if (ws.ownerAccountId === session.accountId) return "owner";
  const email = session.email.trim().toLowerCase();
  const member = (ws.team ?? []).find((m) => m.email.trim().toLowerCase() === email)?.role;
  return member ?? ws.viewerRole ?? null;
}

/**
 * Where a signed-in person starts: admins on the admin overview, content
 * managers in the CMS, everyone else on their brands.
 */
export const homePath = (account: Account | null) =>
  account?.isAdmin ? "/admin" : account?.role === "content" ? "/admin/cms" : "/brands";

/** Owners and editors change a brand; viewers and clients only read it. */
export const canEdit = (role: TeamRole | null) => role === "owner" || role === "editor";

/** UI capabilities mirror the existing server rules; they do not grant access. */
export function capabilitiesOn(ws: Workspace, session: Session | null) {
  const role = roleOn(ws, session);
  return { role, canEdit: canEdit(role), canGovern: role === "owner" };
}

/**
 * Someone who only reviews: on at least one brand, and a client on every one.
 *
 * Read from roles rather than the account type, which older studio accounts
 * also leave empty. A reviewer's home lists what was shared with them, with no
 * way to create a brand and no studio pages.
 */
export function isReviewerOnly(workspaces: Workspace[], session: Session | null): boolean {
  const roles = workspaces.map((ws) => roleOn(ws, session));
  return roles.length > 0 && roles.every((role) => role === "client");
}
