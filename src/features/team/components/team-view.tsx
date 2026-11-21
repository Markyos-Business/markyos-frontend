import { AppFooter, Badge, PageHeader } from "@/components/ui";
import type { TeamPageView } from "../hooks/use-team-page";
import { PAGE_SECTION, ROLE_LABELS, ROLE_TONE } from "../constants";
import { ApprovalSection } from "./approvals/approval-section";
import { TeamSection } from "./members/team-section";
import { SignOffSection } from "./sign-off/sign-off-section";

/** A brand's people, its client sign-off and its approval queue. Saved versions are on Settings → Activity. */
export function TeamView(view: TeamPageView) {
  const { ws, isAr, myRole, canGovern, canEdit } = view;
  return (
    <div className="flex min-h-0 max-w-[820px] flex-1 flex-col gap-6 overflow-auto px-7 py-6.5">
      <PageHeader title={isAr ? PAGE_SECTION.ar : PAGE_SECTION.en} description={<>{isAr
            ? "من يستطيع تغيير ماذا، ومن اعتمده. دورك في هذه العلامة:"
            : "Who can change what, and who approved it. You're signed in on this brand as"}{" "}
          <Badge tone={ROLE_TONE[myRole]}>{ROLE_LABELS[myRole][isAr ? "ar" : "en"]}</Badge></>} />
      <TeamSection {...view} />
      <SignOffSection ws={ws} canGovern={canGovern} isAr={isAr} />
      <ApprovalSection ws={ws} canGovern={canGovern} canPropose={canEdit} isAr={isAr} />
      <AppFooter lang={isAr ? "ar" : "en"} className="mt-auto" />
    </div>
  );
}
