"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { DiscoveryFrame } from "@/components/features/discovery";
import { CallNoteEditor, callHref } from "@/components/features/callnotes";

export default function NewCallNotePage() {
  const { slug } = useParams<{ slug: string }>();
  const { getWorkspace, uiLang } = useApp();
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  return (
    <>
      <TopBar workspace={ws} section="Discovery" arSection="الاستكشاف" />
      <DiscoveryFrame isAr={isAr} wide>
        <CallNoteEditor
          brandId={ws.id}
          team={ws.team}
          noteHref={(id) => callHref(ws.slug, id)}
          backHref={`/w/${ws.slug}/discovery`}
          isAr={isAr}
        />
      </DiscoveryFrame>
    </>
  );
}
