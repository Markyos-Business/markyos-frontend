"use client";

import {
  ActivityFeed,
  Avatar,
  AvatarGroup,
  ContentCard,
  CountBadge,
  KeyValueList,
  StatCard,
  StatGrid,
  StatusDot,
  Tag,
  TrendChip,
} from "@/components/ui";
import type { AvatarPresence, AvatarTone, BadgeTone, TagTone } from "@/components/ui";
import type { StyleGuideCopy } from "../../constants";
import { Demo, GuideSection } from "./GuideParts";

const TAG_TONES: TagTone[] = ["primary", "success", "warning", "danger", "neutral", "indigo"];
const PRESENCE: { presence: AvatarPresence; tone: BadgeTone }[] = [
  { presence: "online", tone: "success" },
  { presence: "away", tone: "warning" },
  { presence: "busy", tone: "danger" },
  { presence: "offline", tone: "neutral" },
];
const AVATAR_TONES: AvatarTone[] = ["accent", "muted"];
const PEOPLE = [
  { id: "1", initials: "NH", name: "Nour Haddad" },
  { id: "2", initials: "OA", name: "Omar Aziz" },
  { id: "3", initials: "LS", name: "Layla Saeed" },
  { id: "4", initials: "KH", name: "Khalid Al-Harbi" },
  { id: "5", initials: "MN", name: "Mariam Nasser" },
  { id: "6", initials: "YF", name: "Yousef Farah" },
];

const DataDisplaySection = ({ c }: { c: StyleGuideCopy }) => (
  <GuideSection id="data" title={c.sections.data}>
    <Demo name="StatGrid · StatCard">
      <StatGrid>
        <StatCard label={c.stats.users} value="1,284" footnote={c.stats.vsLastMonth} trend={{ direction: "up", value: "12%" }} />
        <StatCard label={c.stats.active} value="1,102" footnote={c.stats.vsLastMonth} trend={{ direction: "down", value: "3%" }} />
        <StatCard label={c.stats.invites} value="38" footnote={c.stats.vsLastMonth} trend={{ direction: "neutral", value: "0%" }} />
        <StatCard label={c.stats.suspended} value="—" loading />
      </StatGrid>
    </Demo>

    <div className="grid gap-5 lg:grid-cols-2">
      <Demo name="TrendChip" className="flex flex-wrap gap-space-4">
        <TrendChip direction="up" value="12%" />
        <TrendChip direction="down" value="3%" />
        <TrendChip direction="neutral" value="0%" />
      </Demo>

      <Demo name="Tag" className="flex flex-col gap-space-4">
        <div className="flex flex-wrap gap-space-3">
          {TAG_TONES.map((tone) => (
            <Tag key={tone} tone={tone}>
              {c.tags[tone]}
            </Tag>
          ))}
        </div>
        <div className="flex flex-wrap gap-space-3">
          {TAG_TONES.map((tone) => (
            <Tag key={tone} tone={tone} size="md">
              {c.tags[tone]}
            </Tag>
          ))}
        </div>
      </Demo>

      <Demo name="StatusDot" className="flex flex-wrap gap-space-6">
        {PRESENCE.map(({ presence, tone }) => (
          <StatusDot key={presence} tone={tone} label={c.statuses[presence]} />
        ))}
      </Demo>

      <Demo name="CountBadge" className="flex flex-wrap items-center gap-space-6">
        <CountBadge count={3} label={c.unread} />
        <CountBadge count={42} />
        <CountBadge count={240} />
      </Demo>

      <Demo name="Avatar" className="flex flex-wrap items-center gap-space-5">
        {[24, 30, 40, 56].map((size, i) => (
          <Avatar key={size} initials="NH" size={size} tone={AVATAR_TONES[i % 2]} />
        ))}
        {PRESENCE.map(({ presence }) => (
          <Avatar key={presence} initials="OA" size={40} presence={presence} presenceLabel={c.statuses[presence]} />
        ))}
      </Demo>

      <Demo name="AvatarGroup" className="flex flex-col gap-space-5">
        <AvatarGroup people={PEOPLE.slice(0, 3)} />
        <AvatarGroup people={PEOPLE} max={4} size={32} />
      </Demo>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <Demo name="KeyValueList · rows">
        <KeyValueList items={c.details} />
      </Demo>
      <Demo name="KeyValueList · grid">
        <KeyValueList items={c.details} layout="grid" />
      </Demo>
    </div>

    <Demo name="ContentCard · ActivityFeed">
      <ContentCard title={c.recentActivity} legend={<CountBadge count={c.activity.length} />}>
        <ActivityFeed
          items={c.activity.map((item, i) => ({
            id: String(i),
            icon: item.icon,
            tone: (["success", "warning", "info"] as const)[i],
            title: item.title,
            meta: item.meta,
            time: item.time,
          }))}
        />
      </ContentCard>
    </Demo>
  </GuideSection>
);

export { DataDisplaySection };
