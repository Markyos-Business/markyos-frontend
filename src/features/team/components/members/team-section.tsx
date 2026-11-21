"use client";

import { useState } from "react";
import { Button, EmptyHint, Icon, Section } from "@/components/ui";
import type { TeamPageView } from "../../hooks/use-team-page";
import { InviteMemberForm } from "./invite-member-form";
import { TeamTable } from "./team-table";

/** The brand's people and their roles, with the invite form. */
export function TeamSection({ ws, isAr, canGovern, editorsFull, editorsFullNote }: TeamPageView) {
  const [adding, setAdding] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <Section
      title={t("Team", "الفريق")}
      icon="users"
      right={
        canGovern && <Button variant="ghost" icon={adding ? undefined : <Icon name="plus" size={16} />} onClick={() => setAdding((v) => !v)} className="text-[12px] font-semibold">
          {adding ? t("Cancel", "إلغاء") : t("Invite", "دعوة")}
        </Button>
      }
    >
      {!canGovern && <p className="text-caption text-text-muted">{t("Only the brand owner can manage the team. Ask the owner to add someone or change a role.", "مالك العلامة وحده يدير الفريق. اطلب منه إضافة شخص أو تغيير دوره.")}</p>}
      {adding && canGovern && <InviteMemberForm ws={ws} isAr={isAr} canGovern={canGovern} editorsFull={editorsFull} editorsFullNote={editorsFullNote} onDone={() => setAdding(false)} />}
      {ws.team.length === 0 ? (
        <EmptyHint>{canGovern ? t("Just you so far. Invite editors to collaborate or reviewers to read and leave feedback.", "أنت وحدك حتى الآن. ادعُ محرّرين للعمل معك أو مراجعين للقراءة وإبداء الملاحظات.") : t("No team members yet.", "لا يوجد أعضاء في الفريق بعد.")}</EmptyHint>
      ) : (
        <TeamTable ws={ws} isAr={isAr} canGovern={canGovern} editorsFull={editorsFull} />
      )}
    </Section>
  );
}
