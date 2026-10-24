"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { AssetThumb } from "@/components/ui/media";
import { TeamRole, Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";

/**
 * `role` is the viewer's own role on the brand. Anything but owner means it
 * came to them through someone else's team, and the card says so — otherwise
 * a brand they can only look at sits in the gallery like one they run.
 */
export function WorkspaceCard({ workspace, role = "owner" }: { workspace: Workspace; role?: TeamRole | null }) {
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
          <span className="text-h1 font-medium text-text-faint">{workspace.initials}</span>
        )}
      </div>
      <div className="flex items-start gap-space-4">
        <div className="flex-1 min-w-0">
          <div className="text-h5 font-medium truncate">{workspace.name}</div>
          <div className="text-caption text-text-muted">
            Edited {formatRelative(workspace.updatedAt)} · {workspace.colors.length > 0 ? "active" : "empty"}
          </div>
          {role && role !== "owner" && <div className="text-caption text-text-muted">Shared with you as {role}</div>}
        </div>
        <Badge tone={workspace.sharedStatus === "shared" ? "success" : "neutral"}>
          {workspace.sharedStatus === "shared" ? "Shared" : "Draft"}
        </Badge>
      </div>
    </Link>
  );
}
