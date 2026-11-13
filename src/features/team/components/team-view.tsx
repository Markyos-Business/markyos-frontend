import { Badge } from "@/components/ui";
import type { TeamPageView } from "../hooks/use-team-page";
import { PAGE_SECTION, ROLE_LABELS, ROLE_TONE } from "../constants";
import { ApprovalSection } from "./approvals/approval-section";
import { VersionHistorySection } from "./history/version-history-section";
import { TeamSection } from "./members/team-section";
import { SignOffSection } from "./sign-off/sign-off-section";

/** A brand's people, its client sign-off, its approval queue and its saved versions. */
export function TeamView(view: TeamPageView) {
  const { ws, isAr, myRole, canGovern, canEdit, actorName } = view;
  return (
    <div className="flex min-h-0 max-w-[820px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <div>
        <h1 className="mb-1.5 font-display text-[30px] font-semibold tracking-tight">{isAr ? PAGE_SECTION.ar : PAGE_SECTION.en}</h1>
        <p className="text-[14px] text-text-muted">
          {isAr
            ? "من يستطيع تغيير ماذا، ومن اعتمده، وكيف تتراجع عن خطأ. دورك في هذه العلامة:"
            : "Who can change what, who approved it, and how to undo a mistake. You're signed in on this brand as"}{" "}
          <Badge tone={ROLE_TONE[myRole]}>{ROLE_LABELS[myRole][isAr ? "ar" : "en"]}</Badge>
        </p>

      </div>
      <TeamSection {...view} />
      <SignOffSection ws={ws} canGovern={canGovern} isAr={isAr} />
      <ApprovalSection ws={ws} canGovern={canGovern} canPropose={canEdit} isAr={isAr} />
      <VersionHistorySection ws={ws} isAr={isAr} actorName={actorName} canEdit={canEdit} />
    </div>
  );
}
