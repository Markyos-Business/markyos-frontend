"use client";

import Link from "next/link";
import { Button, Icon, PageHeader } from "@/components/ui";
import type { Workspace } from "@/types";
import type { BrandSort } from "../constants";
import { WorkspaceCard } from "./WorkspaceCard";

type BrandsViewProps = {
  title: string;
  description: string;
  sort: BrandSort;
  onToggleSort: () => void;
  onNew: () => void;
  brands: { workspace: Workspace; role: Parameters<typeof WorkspaceCard>[0]["role"] }[];
  atLimit: boolean;
  limitNote: string;
};

/** The brands as cards, the way to make a new one (or the limit that stops it), and the Shared legend. */
export function BrandsView({ title, description, sort, onToggleSort, onNew, brands, atLimit, limitNote }: BrandsViewProps) {
  return (
    <div className="flex-1 px-space-6 sm:px-space-10 pb-space-10 flex flex-col gap-5 max-w-[1240px] w-full mx-auto">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={onToggleSort} icon={<Icon name="arrows-v" size={16} />}>
              {sort === "updated" ? "Last edited" : "Name A–Z"}
            </Button>
            <Button variant="primary" size="sm" icon={<Icon name="plus" size={18} />} disabled={atLimit} title={atLimit ? limitNote : undefined} onClick={onNew}>
              New workspace
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map(({ workspace, role }) => (
          // A grid of its own, so the card still fills the cell.
          <div key={workspace.id} className="grid">
            <WorkspaceCard workspace={workspace} role={role} />
          </div>
        ))}
        {atLimit ? (
          // Said where the "new" tile would be, so the limit is found
          // before anyone goes looking for a way round it.
          <div className="rounded-card min-h-54 flex flex-col items-center justify-center gap-space-3 border border-dashed border-line-strong px-space-10 text-center text-text-muted">
            <Icon name="lock" size={22} />
            <span className="text-body">{limitNote}</span>
          </div>
        ) : (
          <Link
            href="/brands/new"
            className="mk-card rounded-card min-h-54 flex flex-col items-center justify-center gap-space-3 border border-dashed border-line-strong text-text-muted"
          >
            <Icon name="plus" size={22} />
            <span className="text-body font-medium">New workspace</span>
          </Link>
        )}
      </div>

      {/* The one fact on this screen with a consequence outside the studio,
          and the legend for a badge that is otherwise left to be inferred. */}
      <div className="mt-auto text-caption text-text-faint">
        A brand marked <span className="text-success">Shared</span> has a live client link — anyone holding it can open
        the guideline. Switch it off in that brand&apos;s Settings.
      </div>
    </div>
  );
}
