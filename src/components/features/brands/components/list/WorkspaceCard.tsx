"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { AssetThumb } from "@/components/ui/media";
import { TeamRole, Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";
import type { Lang } from "@/types/lang";
import { brandInitials, brandSetup } from "@/lib/data/brandSetup";
import { BRANDS_COPY } from "../../copy";

/**
 * `role` is the viewer's own role on the brand. Anything but owner means it
 * came to them through someone else's team, and the card says so — otherwise
 * a brand they can only look at sits in the gallery like one they run.
 */
export function WorkspaceCard({
  workspace,
  role = "owner",
  lang = "en",
  c = BRANDS_COPY[lang],
}: {
  workspace: Workspace;
  role?: TeamRole | null;
  lang?: Lang;
  c?: (typeof BRANDS_COPY)["en"];
}) {
  const setup = brandSetup(workspace);
  const complete = setup.filter(step => step.done).length;
  const symbol = workspace.logo.symbol;
  const hasSymbol = symbol.phase === "attached" && symbol.url;

  return (
    <Link href={`/w/${workspace.slug}/overview`} className="mk-card rounded-card bg-surface-1 p-space-8 flex flex-col gap-space-5">
      <div className="mk-surface h-33 rounded-lg grid place-items-center overflow-hidden bg-surface-2">
        {hasSymbol ? (
          // Measured against this well rather than against the theme. A brand
          // whose symbol is a white mark on transparency had a 1.26:1 thumbnail
          // here — a card that looked like it had no logo on it.
          <AssetThumb src={symbol.url} alt="" ground="--surface-2" style={{ height: 44, width: "auto" }} />
        ) : (
          // The initials are the only thing identifying a brand with no
          // symbol yet, so they sit at a contrast that can be read.
          <span className="text-h1 font-medium text-text-faint">{brandInitials(workspace.name)}</span>
        )}
      </div>
      <div className="flex items-start gap-space-4">
        <div className="flex-1 min-w-0">
          <div className="text-h5 font-medium truncate">{workspace.name}</div>
          <div className="text-caption text-text-muted">
            {c.edited(formatRelative(workspace.updatedAt, undefined, lang))} · {lang === "ar" ? `${complete} من ${setup.length} مكتمل` : `${complete} of ${setup.length} done`}
          </div>
          {role && role !== "owner" && <div className="text-caption text-text-muted">{c.sharedWithYou(c.roles[role] ?? role)}</div>}
        </div>
        <Badge tone={workspace.sharedStatus === "shared" ? "success" : "neutral"}>
          {workspace.sharedStatus === "shared" ? c.shared : c.draft}
        </Badge>
      </div>
    </Link>
  );
}
