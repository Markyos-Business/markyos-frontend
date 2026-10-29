"use client";

import { Avatar, Button, CountBadge, Icon, IconButton, PageHeader } from "@/components/ui";
import { SearchField } from "@/components/form";
import { AppTopBar } from "@/components/layout";
import type { StyleGuideCopy } from "../../constants";
import { Demo, GuideSection } from "./GuideParts";

/**
 * The shell's own pieces. AppLayout and AppSidebar wrap every signed-in page
 * already, so they are shown by the app itself, not repeated here.
 */
const LayoutSection = ({ c }: { c: StyleGuideCopy }) => (
  <GuideSection id="layout" title={c.sections.layout}>
    <Demo name="AppTopBar">
      <div className="overflow-hidden rounded-widget bg-canvas shadow-edge-soft">
        <AppTopBar
          title={c.pageTitle}
          subtitle={c.welcome}
          search={<SearchField label={c.searchLabel} placeholder={c.search} shortcut />}
          right={
            <>
              <span className="relative inline-flex">
                <IconButton icon="envelope" iconSize={22} label={c.unread} />
                <CountBadge count={3} label={c.unread} className="absolute -end-1 -top-1" />
              </span>
              <Avatar initials="NH" tone="accent" presence="online" presenceLabel={c.statuses.online} />
            </>
          }
        />
      </div>
    </Demo>

    <Demo name="PageHeader">
      <PageHeader
        breadcrumb={c.breadcrumb}
        title={c.pageTitle}
        description={c.pageDescription}
        secondaryActions={
          <Button variant="outline" icon={<Icon name="file-export" size={18} />}>
            {c.export}
          </Button>
        }
        actions={
          <Button variant="primary" icon={<Icon name="user-plus" size={18} />}>
            {c.invite}
          </Button>
        }
      />
    </Demo>
  </GuideSection>
);

export { LayoutSection };
