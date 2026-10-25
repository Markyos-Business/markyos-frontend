"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { TopBar } from "@/components/layout";
import { Skeleton } from "@/components/ui";
import { DiscoveryFrame } from "@/components/features/discovery";
import { CallNoteEditor, callHref, useCallNote } from "@/components/features/callnotes";

export default function EditCallNotePage() {
  const { slug, noteId } = useParams<{ slug: string; noteId: string }>();
  const { getWorkspace, uiLang } = useApp();
  const { data: note } = useCallNote(noteId);
  const ws = getWorkspace(slug);
  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  return (
    <>
      <TopBar workspace={ws} section="Discovery" arSection="الاستكشاف" />
      <DiscoveryFrame isAr={isAr} wide>
        {note ? (
          <CallNoteEditor
            key={note.id}
            brandId={ws.id}
            team={ws.team}
            note={note}
            noteHref={(id) => callHref(ws.slug, id)}
            backHref={`/w/${ws.slug}/discovery`}
            isAr={isAr}
          />
        ) : (
          <Skeleton className="h-96 w-full rounded-card" />
        )}
      </DiscoveryFrame>
    </>
  );
}
