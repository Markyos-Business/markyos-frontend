"use client";

import { useState } from "react";
import { Button, EmptyHint, Row, Section } from "@/components/ui";
import type { TeamPageView } from "../../hooks/use-team-page";
import { InviteMemberForm } from "./invite-member-form";
import { MemberControls } from "./member-controls";

/** The brand's people and their roles, with the invite form. */
export function TeamSection({ ws, isAr, canGovern, editorsFull, editorsFullNote }: TeamPageView) {
  const [adding, setAdding] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <Section
      title={t("Team", "الفريق")}
      icon="users"
      right={
        canGovern && <Button variant="link" onClick={() => setAdding((v) => !v)} className="text-[12px] font-semibold">
          {adding ? t("Cancel", "إلغاء") : t("+ Invite", "+ دعوة")}
        </Button>
      }
    >
      {!canGovern && <p className="text-caption text-text-muted">{t("Only the brand owner can manage the team. Ask the owner to add someone or change a role.", "مالك العلامة وحده يدير الفريق. اطلب منه إضافة شخص أو تغيير دوره.")}</p>}
      {adding && canGovern && <InviteMemberForm ws={ws} isAr={isAr} canGovern={canGovern} editorsFull={editorsFull} editorsFullNote={editorsFullNote} onDone={() => setAdding(false)} />}
      {ws.team.length === 0 ? (
        <EmptyHint>{canGovern ? t("Just you so far. Invite editors to collaborate or reviewers to read and leave feedback.", "أنت وحدك حتى الآن. ادعُ محرّرين للعمل معك أو مراجعين للقراءة وإبداء الملاحظات.") : t("No team members yet.", "لا يوجد أعضاء في الفريق بعد.")}</EmptyHint>
      ) : (
        <div className="flex flex-col gap-2">
          {ws.team.map((m) => (
            <Row
              key={m.id}
              label={m.name}
              hint={m.email}
              right={<MemberControls ws={ws} member={m} isAr={isAr} canGovern={canGovern} editorsFull={editorsFull} />}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
