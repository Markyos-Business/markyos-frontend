"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useBrandPage } from "@/contexts/pageGuards";
import { useDialog, useToast } from "@/components/ui";
import type { Moodboard } from "@/types";
import { PAGE_SECTION } from "../../constants";
import { holdUploads } from "../../utils/pendingUploads";

/** A board's address: each board is its own project page. */
export const boardHref = (slug: string, boardId: string) => `/w/${slug}/moodboard/${boardId}`;

/** How many cards a board holds, across its zones. */
export const cardCount = (b: Moodboard) => b.zones.reduce((n, z) => n + z.items.length, 0);

/**
 * The moodboard projects page: every board the brand has, as a project to
 * open, and starting, renaming, duplicating or deleting one.
 */
export function useMoodboardProjectsPage(slug: string) {
  const page = useBrandPage(slug);
  const ws = page?.workspace;
  const isAr = !!page?.isAr;
  const router = useRouter();
  const { createMoodboard, renameMoodboard, duplicateMoodboard, deleteMoodboard } = useApp();
  const { confirm, prompt } = useDialog();
  const { showToast } = useToast();
  const [picking, setPicking] = useState(false);

  // The board worked on last comes first: it is the one being returned to.
  const boards = useMemo(
    () => [...(ws?.moodboards ?? [])].sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)),
    [ws]
  );

  if (!page || !ws) return null;

  const open = (id: string) => router.push(boardHref(ws.slug, id));

  const create = (templateKey: string, title: string) => {
    const id = createMoodboard(ws.id, title, templateKey);
    setPicking(false);
    open(id);
  };

  /** Images chosen with no board yet: a board for them, opened with them in it. */
  const uploadNew = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      showToast(isAr ? "اللوح يقبل الصور." : "Moodboards take images.", "danger");
      return;
    }
    const id = createMoodboard(ws.id, isAr ? "استكشاف" : "Exploration", "brand-identity");
    holdUploads(id, images);
    open(id);
  };

  const rename = async (b: Moodboard) => {
    const title = await prompt({
      title: isAr ? "أعد تسمية اللوح" : "Rename board",
      label: isAr ? "الاسم" : "Name",
      initialValue: b.title,
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (title?.trim()) renameMoodboard(ws.id, b.id, title.trim());
  };

  const duplicate = (b: Moodboard) => {
    const id = duplicateMoodboard(ws.id, b.id, isAr ? `${b.title} (نسخة)` : `${b.title} (copy)`);
    if (id) showToast(isAr ? "تم نسخ اللوح." : "Board duplicated.", "success");
  };

  const remove = async (b: Moodboard) => {
    const count = cardCount(b);
    const ok = await confirm({
      title: isAr ? `حذف “${b.title}”؟` : `Delete “${b.title}”?`,
      body: isAr
        ? "يُحذف اللوح. تبقى الصور في ملفات الهوية كاستكشاف، فلا يضيع شيء."
        : `The board goes${count ? `, with its ${count} card${count === 1 ? "" : "s"}` : ""}. The images stay in Brand files as exploration, so nothing is lost.`,
      confirmLabel: isAr ? "حذف اللوح" : "Delete board",
      tone: "danger",
      isAr,
    });
    if (!ok) return;
    deleteMoodboard(ws.id, b.id);
    showToast(isAr ? "حُذف اللوح، والصور محفوظة." : "Board deleted. Images kept.");
  };

  return {
    shell: { workspace: ws, section: PAGE_SECTION.en, arSection: PAGE_SECTION.ar, width: "full" as const },
    view: {
      ws,
      isAr,
      boards,
      picking,
      onPicking: setPicking,
      onCreate: create,
      onUploadNew: uploadNew,
      onRename: (b: Moodboard) => void rename(b),
      onDuplicate: duplicate,
      onDelete: (b: Moodboard) => void remove(b),
    },
  };
}

export type MoodboardProjectsView = NonNullable<ReturnType<typeof useMoodboardProjectsPage>>["view"];
