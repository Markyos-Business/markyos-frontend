import { Badge } from "@/components/ui";
import type { TeamPageView } from "../hooks/useTeamPage";
import { PAGE_SECTION, ROLE_TONE } from "../constants";
import { ApprovalSection } from "./ApprovalSection";
import { SignOffSection } from "./SignOffSection";
import { TeamSection } from "./TeamSection";
import { VersionHistorySection } from "./VersionHistorySection";

/** A brand's people, its client sign-off, its approval queue and its saved versions. */
export function TeamView(view: TeamPageView) {
  const { ws, isAr, myRole, canGovern, actorName } = view;
  return (
    <div className="flex min-h-0 max-w-[820px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? PAGE_SECTION.ar : PAGE_SECTION.en}</h1>
        <p className="text-[14px] text-text-muted">
          Who can change what, who approved it, and how to undo a mistake. You&apos;re signed in as <Badge tone={ROLE_TONE[myRole]}>{myRole}</Badge> on this
          brand.
        </p>
        {/*
          Architecture principle 7: no UI promise without server enforcement.
          These roles decide what this interface offers, and nothing more —
          every check runs in the browser against state the browser owns, so
          anyone with devtools can hand themselves any role.
        */}
        <p className="mt-2 text-[12.5px] text-text-faint">
          Roles shape this interface but are not a security boundary yet — every check still runs in the browser. Real enforcement arrives with the server.
        </p>
      </div>
      <TeamSection {...view} />
      <SignOffSection ws={ws} canGovern={canGovern} />
      <ApprovalSection ws={ws} canGovern={canGovern} actorName={actorName} />
      <VersionHistorySection ws={ws} isAr={isAr} actorName={actorName} />
    </div>
  );
}
