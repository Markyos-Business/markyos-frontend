import type { Session, TeamRole, Workspace } from "../../types";

/**
 * The signed-in person's role on a brand, or null when they have none.
 *
 * The owner is the account the brand belongs to; everyone else is whoever
 * the owner put on its team, matched by email. The server applies the same
 * rule to every request, so this only decides what the app shows and sends.
 */
export function roleOn(ws: Workspace, session: Session | null): TeamRole | null {
  if (!session) return null;
  if (ws.ownerAccountId === session.accountId) return "owner";
  const email = session.email.trim().toLowerCase();
  return ws.team.find((m) => m.email.trim().toLowerCase() === email)?.role ?? null;
}

/** Owners and editors change a brand; viewers and clients only read it. */
export const canEdit = (role: TeamRole | null) => role === "owner" || role === "editor";
