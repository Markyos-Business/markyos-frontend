"use client";

import { ActionsDropdown, ActivityFeed, Avatar, DashboardCard, Tag, useToast } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import type { OverviewCopy } from "../copy";
import type { ActivityEvent, ActivityType, OverviewData, Person, SharedLink } from "../types";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** The client to talk to: a client on the team, or whoever the discovery form went to. */
export function ContactCard({ contact, copy }: { contact: NonNullable<OverviewData["contact"]>; copy: OverviewCopy }) {
  return (
    <DashboardCard title={copy.side.contact} as="h2">
      <div className="flex items-center gap-space-4">
        <Avatar initials={initialsOf(contact.name || contact.email)} size={36} />
        <div className="flex min-w-0 flex-col">
          {contact.name && <span dir="auto" className="bidi-auto truncate text-body font-medium text-text">{contact.name}</span>}
          <a href={`mailto:${contact.email}`} dir="ltr" className="truncate text-caption text-accent-text">
            {contact.email}
          </a>
          {contact.source === "form" && <span className="text-caption text-text-muted">{copy.side.contactFromForm}</span>}
        </div>
      </div>
    </DashboardCard>
  );
}

/** Who is on the brand, by role. Read-only here; Team is where it changes. */
export function PeopleCard({ people, title, copy }: { people: Person[]; title: string; copy: OverviewCopy }) {
  return (
    <DashboardCard title={title} as="h2">
      <ul className="flex flex-col gap-space-4">
        {people.map((p) => (
          <li key={`${p.email}-${p.role}`} className="flex items-center gap-space-4">
            <Avatar initials={initialsOf(p.name || p.email)} size={32} />
            <span dir="auto" className="bidi-auto min-w-0 flex-1 truncate text-body text-text">{p.name}</span>
            <Tag tone={p.role === "owner" ? "primary" : "neutral"}>{copy.side.role[p.role]}</Tag>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

/** The brand's live share links. The one action, copying, is in each row's ⋯ menu. */
export function LinksCard({ links, copy, isAr }: { links: SharedLink[]; copy: OverviewCopy; isAr: boolean }) {
  const { showToast } = useToast();
  const url = (id: string) => `${window.location.origin}/s/${id}`;
  return (
    <DashboardCard title={copy.side.links} as="h2">
      <ul className="flex flex-col">
        {links.map((link) => {
          const name = link.label || copy.side.linkScope[link.scope];
          return (
            <li key={link.id} className="flex min-h-ctl-lg items-center gap-space-4 shadow-rule-t first:shadow-none">
              <div className="flex min-w-0 flex-1 flex-col">
                <span dir="auto" className="bidi-auto truncate text-body text-text">{name}</span>
                <span className="text-caption text-text-muted">
                  {copy.side.linkScope[link.scope]}
                  {link.createdAt ? ` · ${formatRelative(link.createdAt, undefined, isAr ? "ar" : "en")}` : ""}
                </span>
              </div>
              <ActionsDropdown
                iconOnly
                size="sm"
                label={copy.side.linkActions(name)}
                items={[
                  {
                    label: copy.side.copyLink,
                    icon: "copy",
                    onSelect: () => {
                      void navigator.clipboard?.writeText(url(link.id)).then(() => showToast(copy.side.linkCopied));
                    },
                  },
                ]}
              />
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

const ACTIVITY_ICON: Record<ActivityType, string> = {
  form_sent: "envelope",
  form_answered: "inbox",
  analysis_ready: "chart-line",
  draft_proposed: "file-alt",
  draft_accepted: "check",
  draft_rejected: "times",
  signoff_note: "thumbtack",
  signoff_resolved: "check-circle",
  approval_proposed: "user-check",
  approval_approved: "check",
  approval_rejected: "times",
  call_note: "phone",
  link_created: "link",
  link_revoked: "unlink",
  version_saved: "history",
  published: "globe",
  direction_chosen: "palette",
  handed_off: "share-square",
};

/** The last real events on the brand, newest first. */
export function ActivityCard({ events, copy, isAr }: { events: ActivityEvent[]; copy: OverviewCopy; isAr: boolean }) {
  return (
    <DashboardCard title={copy.side.activity} as="h2">
      <ActivityFeed
        items={events.map((e, i) => ({
          id: `${e.type}-${e.at}-${i}`,
          icon: ACTIVITY_ICON[e.type],
          tone: "neutral",
          title: copy.activity[e.type]({ title: e.title, by: e.by }),
          time: formatRelative(e.at, undefined, isAr ? "ar" : "en"),
          dateTime: new Date(e.at).toISOString(),
        }))}
      />
    </DashboardCard>
  );
}
