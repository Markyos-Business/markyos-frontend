"use client";

import { useState } from "react";
import { Button, EmptyHint, Row, Section } from "@/components/ui";
import type { TeamPageView } from "../../hooks/useTeamPage";
import { InviteMemberForm } from "./InviteMemberForm";
import { MemberControls } from "./MemberControls";

/** The brand's people and their roles, with the invite form. */
export function TeamSection({ ws, isAr, canGovern, editorsFull, editorsFullNote }: TeamPageView) {
  const [adding, setAdding] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <Section
      title={t("Team", "الفريق")}
      icon="users"
      right={
        <Button variant="link" onClick={() => setAdding((v) => !v)} className="text-[12px] font-semibold">
          {adding ? t("Cancel", "إلغاء") : t("+ Invite", "+ دعوة")}
        </Button>
      }
    >
      {adding && <InviteMemberForm ws={ws} isAr={isAr} editorsFull={editorsFull} editorsFullNote={editorsFullNote} onDone={() => setAdding(false)} />}
      {ws.team.length === 0 ? (
        <EmptyHint>{t("Just you so far. Invite an editor or a client viewer to see roles in action.", "أنت وحدك حتى الآن. ادعُ محرّرًا أو عميلًا مشاهدًا لترى الأدوار عمليًا.")}</EmptyHint>
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
