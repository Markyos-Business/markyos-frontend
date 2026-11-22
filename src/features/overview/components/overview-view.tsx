"use client";

import type { ReactNode } from "react";
import { AlertBanner, Button, CopyButton, Dashboard, DashboardCard, DashboardProvider, Icon, Popover, Skeleton } from "@/components/ui";
import { ShareLinksPanel } from "@/features/sharing";
import { useApp } from "@/contexts/AppContext";
import type { PathStepKey } from "@/types";
import type { OverviewCopy } from "../copy";
import { actionHref, canEditRole, isNewBrand } from "../logic";
import type { OverviewData } from "../types";
import { AttentionCard } from "./attention-card";
import { BrandGlanceCard } from "./brand-glance-card";
import { OverviewHeader } from "./overview-header";
import { PathRail } from "./path-rail";
import { ActivityCard, ContactCard, LinksCard, PeopleCard } from "./side-cards";

type OverviewViewProps = {
  slug: string;
  isAr: boolean;
  company: boolean;
  copy: OverviewCopy;
  data: OverviewData | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  site: string;
  onSkip: (step: PathStepKey, skipped: boolean) => void;
  onHandOff: () => void;
};

/*
 * Layout (Overview, 22 Nov 2026). From 1024px: the main column and a 340px
 * side column. Below it one column: on a phone the header comes first, then
 * what needs the reader's attention, then the rest. The two columns are
 * `display: contents` below 1024px, so their blocks join the page's own
 * flex column and take `order`; from 1024px they are real columns and every
 * block keeps its place (`lg:order-none`).
 */
const page = "flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start";
const column = "contents lg:flex lg:flex-col lg:gap-5";
const wide = "lg:col-span-2 lg:order-none";
// Written out: Tailwind only builds class names it can read in the source.
const ORDER = {
  1: "order-1 lg:order-none",
  2: "order-2 lg:order-none",
  3: "order-3 lg:order-none",
  4: "order-4 lg:order-none",
  5: "order-5 lg:order-none",
  6: "order-6 lg:order-none",
} as const;
const at = (n: keyof typeof ORDER) => ORDER[n];

/** The Overview: the project overview (studio, freelancer) or the brand home (company). */
export function OverviewView(props: OverviewViewProps) {
  const { data, loading, failed, copy, onRetry } = props;
  if (loading) return <OverviewSkeleton company={props.company} isAr={props.isAr} />;
  if (failed || !data) {
    return (
      <Frame isAr={props.isAr}>
        <DashboardCard title={copy.page.title} state="error" errorMessage={copy.error.page} onRetry={onRetry} />
      </Frame>
    );
  }
  return (
    <Frame isAr={props.isAr}>
      {data.demo && <AlertBanner tone="info" title={copy.demo.title} message={copy.demo.body} />}
      {props.company ? <BrandHome {...props} data={data} /> : <ProjectOverview {...props} data={data} />}
    </Frame>
  );
}

/** The page's scroll area, in the dashboard kit's language (its cards' own words). */
const Frame = ({ isAr, children }: { isAr: boolean; children: ReactNode }) => (
  <DashboardProvider lang={isAr ? "ar" : "en"}>
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-7 py-6.5">{children}</div>
  </DashboardProvider>
);

/** Opens the published guideline in a new tab: a real link, drawn as the primary button. */
function OpenSite({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="primary" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
        <Icon name="external-link-alt" size={16} />
      </a>
    </Button>
  );
}

/**
 * One block of the page. A block the server couldn't work out (named in
 * `errors`) shows its own error with Try again, and the rest of the page
 * works; a block with nothing to show is left out.
 */
function Block({ block, data, title, copy, onRetry, show, className, children }: { block: NonNullable<OverviewData["errors"]>[number]; data: OverviewData; title: string; copy: OverviewCopy; onRetry: () => void; show: boolean; className?: string; children: ReactNode }) {
  const failed = !!data.errors?.includes(block);
  if (!failed && !show) return null;
  return (
    <div className={className}>
      {failed ? <DashboardCard title={title} state="error" errorMessage={copy.error.block} onRetry={onRetry} /> : children}
    </div>
  );
}

/** The page's one primary button, from the stage (worked out on the server). */
function MainAction({ data, slug, site, copy, onHandOff }: Pick<OverviewViewProps, "slug" | "site" | "copy" | "onHandOff"> & { data: OverviewData }) {
  const action = data.mainAction;
  if (!action) return null;
  const href = actionHref(slug, action, site);
  if (action === "open_guide") return <OpenSite href={site} label={copy.action.open_guide} />;
  return href ? (
    <Button variant="primary" href={href}>
      {copy.action[action]}
    </Button>
  ) : (
    <Button variant="primary" onClick={onHandOff}>
      {copy.action[action]}
    </Button>
  );
}

/** Share with client: the guideline's link once it's live, and the strategy share links. */
function SharePopover({ data, slug, site, copy, isAr }: { data: OverviewData; slug: string; site: string; copy: OverviewCopy; isAr: boolean }) {
  const { getWorkspace } = useApp();
  const ws = getWorkspace(slug) ?? null;
  return (
    <Popover label={copy.header.share} look={{ variant: "secondary", size: "md" }} width={430} button={<><Icon name="share-alt" size={16} />{copy.header.share}</>}>
      {() => (
        <div className="flex flex-col gap-space-5 p-space-5">
          <div className="flex flex-col gap-space-2">
            <span className="text-caption text-text-muted">{copy.share.guideLink}</span>
            {data.site.live ? (
              <div className="flex items-center gap-ctl-row">
                <bdi dir="ltr" className="min-w-0 flex-1 truncate font-mono text-caption text-text">{site}</bdi>
                <CopyButton size="sm" text={site} label={copy.share.copyGuideLink} copiedMessage={copy.share.copied} />
              </div>
            ) : (
              <p className="text-body text-text-muted">{copy.share.notLive}</p>
            )}
          </div>
          {ws && <ShareLinksPanel ws={ws} scope="strategy" isAr={isAr} />}
        </div>
      )}
    </Popover>
  );
}

function ProjectOverview({ data, slug, isAr, copy, site, onSkip, onHandOff, onRetry }: OverviewViewProps & { data: OverviewData }) {
  const canEdit = canEditRole(data.role);
  const fresh = isNewBrand(data);
  const stage = data.stage ?? null;
  const chip = data.steps ? { label: copy.stage[stage ?? "complete"], tone: stage ? ("primary" as const) : ("success" as const) } : undefined;
  const header = (
    <OverviewHeader
      header={data.header}
      isAr={isAr}
      subline={data.contact?.name || undefined}
      chip={chip}
      actions={
        canEdit ? (
          <>
            <SharePopover data={data} slug={slug} site={site} copy={copy} isAr={isAr} />
            <MainAction data={data} slug={slug} site={site} copy={copy} onHandOff={onHandOff} />
          </>
        ) : data.site.live ? (
          <OpenSite href={site} label={copy.action.open_guide} />
        ) : null
      }
    />
  );

  // Viewers and clients: the header and the brand, nothing to act on.
  if (data.trimmed) {
    return (
      <div className={page}>
        <div className={wide}>{header}</div>
        <Block block="glance" data={data} title={copy.soFar.glanceTitle} copy={copy} onRetry={onRetry} show={!!data.glance} className={wide}>
          <BrandGlanceCard glance={data.glance} mode="home" slug={slug} copy={copy} isAr={isAr} links={data.role !== "client"} />
        </Block>
      </div>
    );
  }

  return (
    <div className={page}>
      <div className={`${wide} ${at(1)}`}>{header}</div>
      {data.steps && (
        <div className={`${wide} ${at(3)}`}>
          <PathRail steps={data.steps} stage={stage} slug={slug} copy={copy} canEdit={canEdit} onSkip={onSkip} />
        </div>
      )}
      {/* A brand with nothing started shows the header, the path and the main action: no empty widgets. */}
      {!fresh && (
        <>
          <div className={column}>
            <Block block="attention" data={data} title={copy.attention.title} copy={copy} onRetry={onRetry} show className={at(2)}>
              <AttentionCard items={data.attention ?? []} slug={slug} copy={copy} isAr={isAr} />
            </Block>
            <Block block="glance" data={data} title={copy.soFar.title} copy={copy} onRetry={onRetry} show className={at(4)}>
              <BrandGlanceCard glance={data.glance} mode="project" slug={slug} copy={copy} isAr={isAr} />
            </Block>
          </div>
          <div className={column}>
            <Block block="contact" data={data} title={copy.side.contact} copy={copy} onRetry={onRetry} show={!!data.contact} className={at(5)}>
              {data.contact && <ContactCard contact={data.contact} copy={copy} />}
            </Block>
            <Block block="people" data={data} title={copy.side.team} copy={copy} onRetry={onRetry} show={!!data.people?.length} className={at(5)}>
              <PeopleCard people={data.people ?? []} title={copy.side.team} copy={copy} />
            </Block>
            <Block block="links" data={data} title={copy.side.links} copy={copy} onRetry={onRetry} show={!!data.shareLinks?.length} className={at(6)}>
              <LinksCard links={data.shareLinks ?? []} copy={copy} isAr={isAr} />
            </Block>
            <Block block="activity" data={data} title={copy.side.activity} copy={copy} onRetry={onRetry} show={!!data.activity?.length} className={at(6)}>
              <ActivityCard events={data.activity ?? []} copy={copy} isAr={isAr} />
            </Block>
          </div>
        </>
      )}
    </div>
  );
}

function BrandHome({ data, slug, isAr, copy, site, onRetry }: OverviewViewProps & { data: OverviewData }) {
  const canEdit = canEditRole(data.role);
  const owner = data.role === "owner";
  const fresh = isNewBrand(data);
  const live = data.site.live;
  const hasLogo = !!data.glance?.logos.length;

  const actions = (
    <>
      {owner && (
        <Button variant="secondary" href={`/w/${slug}/team`} icon={<Icon name="user-plus" size={16} />}>
          {copy.header.invite}
        </Button>
      )}
      {live ? (
        <OpenSite href={site} label={copy.header.openHub} />
      ) : canEdit ? (
        <Button variant="primary" href={`/w/${slug}/builder`}>
          {copy.action.build_guide}
        </Button>
      ) : null}
    </>
  );
  const header = (
    <OverviewHeader
      header={data.header}
      isAr={isAr}
      chip={{ label: live ? copy.header.published : copy.header.notPublished, tone: live ? "success" : "neutral" }}
      actions={actions}
    />
  );

  // Ask the brand has no backend yet (apps/ai reserves the feature only), so it isn't offered.
  const quick: Dashboard.QuickAction[] = [];
  if (data.role !== "client") {
    quick.push({ icon: "shield-alt", href: `/w/${slug}/compliance`, label: copy.quick.check.label, description: copy.quick.check.description });
    if (hasLogo) quick.push({ icon: "download", href: `/w/${slug}/visual-identity?tab=logo`, label: copy.quick.logo.label, description: copy.quick.logo.description });
    if (owner) quick.push({ icon: "share-alt", href: `/w/${slug}/settings`, label: copy.quick.share.label, description: copy.quick.share.description });
  }
  const quickBlock = quick.length > 0 && (
    <section aria-labelledby="overview-quick" className="flex flex-col gap-space-4">
      <h2 id="overview-quick" className="text-h5 font-medium text-text">{copy.quick.title}</h2>
      <Dashboard.QuickActions actions={quick} />
    </section>
  );
  const glance = <BrandGlanceCard glance={data.glance} mode="home" slug={slug} copy={copy} isAr={isAr} links={data.role !== "client"} />;

  if (data.trimmed || fresh) {
    return (
      <div className={page}>
        <div className={wide}>{header}</div>
        {quickBlock && <div className={wide}>{quickBlock}</div>}
        <Block block="glance" data={data} title={copy.soFar.glanceTitle} copy={copy} onRetry={onRetry} show={!!data.glance} className={wide}>
          {glance}
        </Block>
      </div>
    );
  }

  return (
    <div className={page}>
      <div className={`${wide} ${at(1)}`}>{header}</div>
      <div className={column}>
        {quickBlock && <div className={at(3)}>{quickBlock}</div>}
        <Block block="glance" data={data} title={copy.soFar.glanceTitle} copy={copy} onRetry={onRetry} show className={at(4)}>
          {glance}
        </Block>
      </div>
      <div className={column}>
        <Block block="attention" data={data} title={copy.attention.title} copy={copy} onRetry={onRetry} show className={at(2)}>
          <AttentionCard items={data.attention ?? []} slug={slug} copy={copy} isAr={isAr} />
        </Block>
        <Block block="people" data={data} title={copy.side.people} copy={copy} onRetry={onRetry} show={!!data.people?.length} className={at(5)}>
          <PeopleCard people={data.people ?? []} title={copy.side.people} copy={copy} />
        </Block>
        <Block block="activity" data={data} title={copy.side.activity} copy={copy} onRetry={onRetry} show={!!data.activity?.length} className={at(6)}>
          <ActivityCard events={data.activity ?? []} copy={copy} isAr={isAr} />
        </Block>
      </div>
    </div>
  );
}

/** The final layout's shape while it loads, so nothing moves when it arrives. */
function OverviewSkeleton({ company, isAr }: { company: boolean; isAr: boolean }) {
  return (
    <Frame isAr={isAr}>
      <div aria-busy="true" className={page}>
        <div className={`${wide} flex items-center gap-space-5`}>
          <Skeleton className="size-14 rounded-card" />
          <div className="flex flex-1 flex-col gap-space-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-ctl-md w-40 rounded-lg" />
        </div>
        <div className={wide}>
          <Skeleton className={company ? "h-28 w-full rounded-card" : "h-24 w-full rounded-card"} />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-56 w-full rounded-card" />
          <Skeleton className="h-72 w-full rounded-card" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </div>
    </Frame>
  );
}
