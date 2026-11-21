"use client";

import Link from "next/link";
import { Badge, Dashboard, DashboardCard } from "@/components/ui";
import { AssetThumb } from "@/components/ui";
import { TeamRole, Workspace } from "@/types";
import { formatRelative } from "@/lib/utils";
import type { Lang } from "@/types/lang";
import { brandInitials, brandSetup } from "@/lib/data/brandSetup";
import { BRANDS_COPY } from "../../copy";

/** First letter up; Arabic has no case, so it passes through. */
const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

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

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  return (
    <Link href={`/w/${workspace.slug}/overview`} aria-label={t(`Open ${workspace.name}`, `فتح ${workspace.name}`)} className="mk-card block h-full rounded-card">
      <DashboardCard
        title={<span dir="auto">{workspace.name}</span>}
        subtitle={c.edited(formatRelative(workspace.updatedAt, undefined, lang))}
        actions={<Badge tone={workspace.sharedStatus === "shared" ? "success" : "neutral"}>{workspace.sharedStatus === "shared" ? c.shared : c.draft}</Badge>}
        className="h-full"
        footer={<Dashboard.CardFooterStats items={[
          // A client gets no working document, so a setup count would be made
          // up; what they can act on is whether the guideline is out.
          role === "client"
            ? { label: t("Guideline", "الدليل"), value: workspace.published ? t("Ready to review", "جاهز للمراجعة") : t("Not published yet", "لم يُنشر بعد") }
            : { label: t("Brand setup", "إعداد العلامة"), value: t(`${complete} of ${setup.length} done`, `${complete} من ${setup.length} مكتمل`) },
          // A value stands alone, so it takes a capital; the lowercase word is
          // for the "shared with you as …" sentence below.
          { label: t("Your role", "دورك"), value: capitalise(c.roles[role ?? ""] ?? "—") },
        ]} />}
      >
        <div className="mk-surface grid h-33 place-items-center overflow-hidden rounded-widget bg-surface-2">
          {hasSymbol ? <AssetThumb src={symbol.url} alt="" ground="--surface-2" style={{ height: 44, width: "auto" }} /> : <span className="text-h1 font-medium text-text-muted">{brandInitials(workspace.name)}</span>}
        </div>
        {role && role !== "owner" && <p className="mt-space-3 text-caption text-text-muted">{c.sharedWithYou(c.roles[role] ?? role)}</p>}
      </DashboardCard>
    </Link>
  );
}
