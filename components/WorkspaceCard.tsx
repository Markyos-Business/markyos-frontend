"use client";

import Link from "next/link";
import { AssetThumb } from "@/components/AssetThumb";
import { Workspace } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const symbol = workspace.logo.symbol;
  const hasSymbol = symbol.phase === "attached" && symbol.url;

  return (
    <Link
      href={`/w/${workspace.slug}/overview`}
      className="mk-card rounded-2xl p-4 flex flex-col gap-3.5"
      style={{ background: "var(--surface-1)" }}
    >
      <div
        className="mk-surface h-[132px] rounded-[11px] grid place-items-center overflow-hidden"
        style={{ background: "var(--surface-2)" }}
      >
        {hasSymbol ? (
          // Measured against this well rather than against the theme. A brand
          // whose symbol is a white mark on transparency had a 1.26:1 thumbnail
          // here — a card that looked like it had no logo on it.
          <AssetThumb src={symbol.url} alt="" ground="--surface-2" style={{ height: 44, width: "auto" }} />
        ) : (
          <span
            className="font-semibold text-[34px]"
            // Was a literal #3d3d44, which is 1.58:1 on this card in the dark
            // theme — the initials are the only thing identifying a brand with
            // no symbol yet, and they simply weren't visible.
            style={{ fontFamily: "var(--font-display)", color: "var(--text-faint)" }}
          >
            {workspace.initials}
          </span>
        )}
      </div>
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] truncate">{workspace.name}</div>
          <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Edited {formatRelative(workspace.updatedAt)} ·{" "}
            {workspace.colors.length > 0 ? "active" : "empty"}
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full shrink-0"
          style={
            workspace.sharedStatus === "shared"
              ? { background: "color-mix(in srgb, var(--success) 16%, transparent)", color: "var(--success)" }
              : { background: "var(--surface-3)", color: "var(--text-muted)" }
          }
        >
          {workspace.sharedStatus === "shared" ? "Shared" : "Draft"}
        </span>
      </div>
    </Link>
  );
}
