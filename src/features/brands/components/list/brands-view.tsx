"use client";

import Link from "next/link";
import { SortControl } from "@/components/ui";
import { Button, DashboardHeader, DashboardProvider, Icon, Stagger } from "@/components/ui";
import type { Workspace } from "@/types";
import type { BrandSort } from "../../constants";
import type { BRANDS_COPY } from "../../copy";
import type { Lang } from "@/types/lang";
import { WorkspaceCard } from "./workspace-card";

type BrandsViewProps = {
  title: string;
  description: string;
  sort: BrandSort;
  onSort: (sort: BrandSort) => void;
  onNew: () => void;
  brands: { workspace: Workspace; role: Parameters<typeof WorkspaceCard>[0]["role"] }[];
  atLimit: boolean;
  limitNote: string;
  c: (typeof BRANDS_COPY)["en"];
  lang: Lang;
  /** A client reviewer: no create actions, no studio legend. */
  reviewer?: boolean;
};

/** The brands as cards, the way to make a new one (or the limit that stops it), and the Shared legend. */
export function BrandsView({ title, description, sort, onSort, onNew, brands, atLimit, limitNote, c, lang, reviewer = false }: BrandsViewProps) {
  return (
    <DashboardProvider lang={lang}><div className="flex-1 px-space-6 sm:px-space-10 pb-space-10 flex flex-col gap-5 max-w-[1240px] w-full mx-auto">
      <DashboardHeader
        title={title}
        subtitle={description}
        secondaryActions={<SortControl label={lang === "ar" ? "ترتيب العلامات" : "Sort brands"} value={sort === "updated" ? "" : sort} defaultLabel={c.lastEdited}
              options={[{value:"name",label:c.nameAz}]} onChange={value => onSort(value === "name" ? "name" : "updated")} />}
        // The page's main action is always making a brand. At the account's
        // limit it still opens /brands/new, which says why; the plans link is
        // the dashed tile in the grid, not the page's one primary button.
        primaryAction={reviewer ? undefined : <Button variant="primary" icon={<Icon name="plus" size={18} />} onClick={onNew}>
              {c.newWorkspace}
            </Button>}
      />

      {/* The four count tiles that sat here repeated each other and the line
          under the title, and pushed the brands below the fold on a phone. */}

      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map(({ workspace, role }) => (
          // A grid of its own, so the card still fills the cell.
          <div key={workspace.id} className="grid">
            <WorkspaceCard workspace={workspace} role={role} c={c} lang={lang} />
          </div>
        ))}
        {reviewer ? null : atLimit ? (
          // Said where the "new" tile would be, so the limit is found
          // before anyone goes looking for a way round it.
          <Link href="/account?tab=billing" className="mk-card rounded-card min-h-54 flex flex-col items-center justify-center gap-space-3 border border-dashed border-line-strong px-space-10 text-center text-text-muted">
            <Icon name="lock" size={22} />
            <span className="text-body">{limitNote}</span>
            <span className="text-body font-medium text-accent-text">{c.reviewPlans}</span>
          </Link>
        ) : (
          <Link
            href="/brands/new"
            className="mk-card rounded-card min-h-54 flex flex-col items-center justify-center gap-space-3 border border-dashed border-line-strong text-text-muted"
          >
            <Icon name="plus" size={22} />
            <span className="text-body font-medium">{c.newWorkspace}</span>
          </Link>
        )}
      </Stagger>

      {/* The one fact on this screen with a consequence outside the studio,
          and the legend for a badge that is otherwise left to be inferred. */}
      {!reviewer && (
        <div className="mt-auto text-caption text-text-faint">
          {c.sharedLegendBefore} <span className="text-success">{c.shared}</span> {c.sharedLegendAfter}
        </div>
      )}
    </div></DashboardProvider>
  );
}
