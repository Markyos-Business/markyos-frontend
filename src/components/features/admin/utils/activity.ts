import type { ActivityItem, BadgeTone } from "@/components/ui";
import type { UsersCopy } from "../copy";
import type { AdminActivity } from "../types";
import { relativeTime } from "./format";

const LOOK: Record<AdminActivity["kind"], { icon: string; tone: BadgeTone }> = {
  joined: { icon: "user-plus", tone: "accent" },
  verified: { icon: "check-circle", tone: "success" },
  password_changed: { icon: "key", tone: "info" },
  signed_in: { icon: "laptop", tone: "neutral" },
  brand_created: { icon: "swatchbook", tone: "indigo" },
  invited: { icon: "envelope", tone: "accent" },
  invite_resent: { icon: "envelope", tone: "accent" },
  role_changed: { icon: "user-shield", tone: "warning" },
  type_changed: { icon: "user-shield", tone: "warning" },
  deactivated: { icon: "user-slash", tone: "danger" },
  reactivated: { icon: "user-check", tone: "success" },
  signed_out: { icon: "sign-out-alt", tone: "danger" },
  session_ended: { icon: "sign-out-alt", tone: "danger" },
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** One history entry as the feed shows it, worded in the admin's language. */
export function describeActivity(item: AdminActivity, c: UsersCopy, lang: "en" | "ar", now = new Date()): ActivityItem {
  const a = c.activity;
  const d = item.detail;
  const device = d.browser && d.os ? c.sessions.on(str(d.browser), str(d.os)) : str(d.browser) || str(d.os) || c.sessions.unknown;
  const role = (r: unknown) => c.roles[str(r) as keyof UsersCopy["roles"]] ?? str(r);
  const type = (t: unknown) => c.types[(str(t) || "none") as keyof UsersCopy["types"]] ?? str(t);

  const title = {
    joined: a.joined,
    verified: a.verified,
    password_changed: a.password_changed,
    signed_in: a.signed_in,
    brand_created: a.brand_created(str(d.brand)),
    invited: a.invited,
    invite_resent: a.invite_resent,
    role_changed: a.role_changed(role(d.from), role(d.to)),
    type_changed: a.type_changed(type(d.from), type(d.to)),
    deactivated: a.deactivated,
    reactivated: a.reactivated,
    signed_out: a.signed_out,
    session_ended: a.session_ended(device),
  }[item.kind];

  // Who did it, for an admin's action; where from, for a sign-in.
  const meta = d.by ? a.by(str(d.by)) : item.kind === "signed_in" ? [device, str(d.ip)].filter(Boolean).join(" · ") : undefined;

  return {
    id: item.id,
    ...(LOOK[item.kind] ?? { icon: "history", tone: "neutral" }),
    title,
    meta,
    time: relativeTime(item.at, lang, now),
    dateTime: item.at,
  };
}
