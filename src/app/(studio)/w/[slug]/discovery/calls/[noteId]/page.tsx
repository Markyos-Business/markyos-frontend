"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { DiscoveryFrame } from "@/components/features/discovery";
import { CallNoteDetail, callHref } from "@/components/features/callnotes";

export default function CallNotePage() {
  const { slug, noteId } = useParams<{ slug: string; noteId: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  return (
    <>
      <TopBar workspace={ws} section="Discovery" arSection="الاستكشاف" />
      <DiscoveryFrame isAr={isAr}>
        <CallNoteDetail noteId={noteId} editHref={`${callHref(ws.slug, noteId)}/edit`} backHref={`/w/${ws.slug}/discovery`} isAr={isAr} />
      </DiscoveryFrame>
    </>
  );
}
