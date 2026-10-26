"use client";

import { type RefObject, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useDialog, useToast } from "@/components/ui";
import type { Moodboard, MoodboardItem, MoodboardZone, Workspace } from "@/types";
import type { ZoneAction } from "../components/Zone";
import { fileToDownscaledDataUrl } from "../model/imageDownscale";
import { sampleImage } from "../model/sampleImage";
import { zoneForKind } from "../model/zones";

type MoodboardActionsArgs = {
  ws: Workspace;
  board: Moodboard | null;
  isAr: boolean;
  onActive: (id: string | null) => void;
  onPicking: (picking: boolean) => void;
  /** The hidden file input uploads go through; owned by the view that renders it. */
  fileRef: RefObject<HTMLInputElement | null>;
};

/**
 * Everything a moodboard can be asked to do: make a board, add, delete and
 * restore cards, upload, read colours out of an image, propose a zone to
 * Drafts, and rename or remove zones and boards.
 */
export function useMoodboardActions({ ws, board, isAr, onActive, onPicking, fileRef }: MoodboardActionsArgs) {
  const {
    addAsset,
    createMoodboard,
    deleteMoodboard,
    renameMoodboard,
    addMoodboardZone,
    patchMoodboardZone,
    removeMoodboardZone,
    addMoodboardItems,
    removeMoodboardItem,
    restoreMoodboardItem,
    labelMoodboardEdge,
    tidyMoodboard,
    addDraft,
    state,
  } = useApp();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();
  const me = state.session?.name ?? "You";
  /** Which zone an upload started from, so files land where they were dropped. */
  const uploadZoneRef = useRef<string | null>(null);
  /** And where on the board, when the Image tool was used to place them. */
  const uploadAtRef = useRef<{ x: number; y: number } | null>(null);
  const [busyZone, setBusyZone] = useState<string | null>(null);

  function makeBoard(templateKey: string, title: string) {
    const id = createMoodboard(ws.id, title, templateKey);
    onActive(id);
    onPicking(false);
    showToast(isAr ? "تم إنشاء اللوح." : "Board created — start filling the zones.", "success");
  }

  // ------------------------------------------------------------- adding ----

  /**
   * Adds one card to a zone, optionally at a point on the canvas.
   *
   * `at` is what the toolbar's placing tools pass: a card put down with the Note
   * tool goes exactly where it was clicked. Without it — the zone's own `+`
   * menu, in either view — the card carries no coordinates and falls under the
   * derived layout, which is the same thing as being added to the end of a list.
   */
  async function addCard(zoneId: string, kind: MoodboardItem["kind"], at?: { x: number; y: number }) {
    if (!board) return;

    if (kind === "asset") {
      uploadZoneRef.current = zoneId;
      uploadAtRef.current = at ?? null;
      fileRef.current?.click();
      return;
    }

    if (kind === "swatch") {
      addMoodboardItems(ws.id, board.id, zoneId, [{ kind: "swatch", hex: "#6b7280", size: "s", ...at }]);
      return;
    }

    if (kind === "note") {
      addMoodboardItems(ws.id, board.id, zoneId, [{ kind: "note", note: "", ...at }]);
      return;
    }

    if (kind === "link") {
      const url = await prompt({
        title: isAr ? "أضف رابطًا" : "Add a link",
        label: isAr ? "العنوان" : "URL",
        placeholder: "https://…",
        confirmLabel: isAr ? "إضافة" : "Add",
        isAr,
      });
      if (!url?.trim()) return;
      let host = "";
      try {
        host = new URL(url).hostname;
      } catch {
        showToast(isAr ? "هذا لا يبدو رابطًا." : "That doesn't look like a link.", "danger");
        return;
      }
      addMoodboardItems(ws.id, board.id, zoneId, [{ kind: "link", url: url.trim(), name: host, ...at }]);
      return;
    }

    if (kind === "font") {
      const fonts = ws.assets.filter((a) => a.type === "font");
      if (fonts.length === 0) {
        showToast(
          isAr
            ? "لا توجد خطوط في ملفات الهوية بعد — ارفع واحدًا أولًا."
            : "No fonts in brand files yet — upload one first.",
          "danger",
        );
        return;
      }
      const name = await prompt({
        title: isAr ? "أي خط؟" : "Which typeface?",
        label: isAr ? "اسم العائلة" : "Family name",
        initialValue: fonts[0].font?.family ?? fonts[0].fileName,
        confirmLabel: isAr ? "إضافة" : "Add",
        isAr,
      });
      if (!name?.trim()) return;
      const match = fonts.find((f) => (f.font?.family ?? f.fileName) === name.trim());
      addMoodboardItems(ws.id, board.id, zoneId, [
        { kind: "font", name: name.trim(), assetId: match?.id, ...at },
      ]);
    }
  }

  /**
   * Delete a card, and offer it back.
   *
   * A card carries a position somebody chose, votes other people cast and
   * connections drawn between it and the rest of the board, and all of that
   * went with one click of a small × with nothing in the product to restore it.
   * A confirm on every delete would be a tax on the ninety-nine times somebody
   * meant it; an undo costs nothing up front and still catches the one time
   * they did not. The whole card and its edges are captured *before* the
   * delete, because afterwards there is nothing left to read them from.
   */
  function handleRemoveItem(itemIds: string[]) {
    if (!board || itemIds.length === 0) return;
    const boardId = board.id;
    // Captured before the delete, because afterwards there is nothing left to
    // read them from. One entry per card, so one Undo puts the whole group back
    // in the zones they each came from.
    const removed = itemIds.flatMap((itemId) => {
      const zone = board.zones.find((z) => z.items.some((i) => i.id === itemId));
      const item = zone?.items.find((i) => i.id === itemId);
      if (!zone || !item) return [];
      return [{
        zoneId: zone.id,
        item,
        edges: (board.edges ?? []).filter((e) => e.from === itemId || e.to === itemId),
      }];
    });

    for (const itemId of itemIds) removeMoodboardItem(ws.id, boardId, itemId);
    if (removed.length === 0) return;

    const n = removed.length;
    showToast(
      isAr
        ? n === 1 ? "حُذفت البطاقة." : `حُذفت ${n} بطاقات.`
        : n === 1 ? "Card deleted." : `${n} cards deleted.`,
      "default",
      {
        label: isAr ? "تراجع" : "Undo",
        run: () => {
          for (const r of removed) restoreMoodboardItem(ws.id, boardId, r.zoneId, r.item, r.edges);
        },
      },
    );
  }

  async function handleUpload(files: FileList, intoZoneId?: string | null) {
    if (intoZoneId !== undefined) uploadZoneRef.current = intoZoneId;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      showToast(isAr ? "اللوح يقبل الصور." : "Moodboards take images.", "danger");
      return;
    }

    const target = board;
    if (!target) {
      const id = createMoodboard(ws.id, isAr ? "استكشاف" : "Exploration", "brand-identity");
      onActive(id);
      // The board is created in the same tick; the next render has it. Bail
      // rather than guess at its zone ids, and say so — silently dropping the
      // files the person just chose would be worse than one more click.
      showToast(
        isAr ? "تم إنشاء لوح — أعد رفع الصور فيه." : "Created a board — drop the images in again.",
        "success",
      );
      return;
    }

    const zoneId =
      uploadZoneRef.current ?? zoneForKind(target.zones, "imagery")?.id ?? target.zones[0]?.id;
    if (!zoneId) return;

    const ids: string[] = [];
    for (const file of list) {
      // Reduced to a size a card can use. A board is filled straight off a
      // camera, and full-resolution photographs cost hundreds of megabytes of
      // decoded bitmap to draw thumbnails with — see lib/imageDownscale.ts.
      const url = await fileToDownscaledDataUrl(file);
      ids.push(
        addAsset(ws.id, {
          type: "photo",
          fileName: file.name,
          url,
          // Measured from what is stored, not from what was chosen: a 6MB
          // photo kept as a 400KB reference should not claim 6MB of the
          // workspace's budget in the file list.
          sizeKB: Math.max(1, Math.round((url.length * 0.75) / 1024)),
          tags: ["moodboard"],
          // The whole reason this page is safe to fill with other people's work.
          status: "exploration",
        }),
      );
    }
    // Several files placed at one point are fanned out rather than stacked, so
    // picking three images with the Image tool does not look like picking one.
    const at = uploadAtRef.current;
    addMoodboardItems(
      ws.id,
      target.id,
      zoneId,
      ids.map((assetId, i) => ({
        kind: "asset" as const,
        assetId,
        ...(at ? { x: at.x + i * 24, y: at.y + i * 24 } : null),
      })),
    );
    uploadZoneRef.current = null;
    uploadAtRef.current = null;
    showToast(
      isAr ? `${ids.length} أضيفت كاستكشاف.` : `${ids.length} added as exploration.`,
      "success",
    );
  }

  // ------------------------------------------------------------ reading ----

  /**
   * Reads the colours out of one image and drops them into the palette zone as
   * swatches — not as a Draft.
   *
   * Sampling one picture is a step in looking, not a proposal about the brand.
   * The proposal is the palette zone as a whole, once somebody has decided what
   * belongs in it.
   */
  async function sampleOne(url: string) {
    if (!board) return;
    const palette = zoneForKind(board.zones, "palette");
    if (!palette) {
      showToast(isAr ? "لا يوجد قسم ألوان على هذا اللوح." : "This board has no palette zone.", "danger");
      return;
    }
    setBusyZone(palette.id);
    try {
      const result = await sampleImage(url);
      if (!result.ok) {
        showToast(
          result.reason === "tainted"
            ? isAr
              ? "لا يمكن قراءة هذه الصورة — الروابط الخارجية تمنع ذلك عادة. ارفع الملف بدلًا من ذلك."
              : "This image can't be read — linked references usually block it. Upload the file instead."
            : isAr
              ? "تعذّرت قراءة هذه الصورة."
              : "Couldn't read that image.",
          "danger",
        );
        return;
      }
      const existing = new Set(palette.items.map((i) => i.hex?.toLowerCase()).filter(Boolean));
      const fresh = result.colors.filter((c) => !existing.has(c.hex.toLowerCase()));
      if (fresh.length === 0) {
        showToast(isAr ? "كل هذه الألوان موجودة بالفعل." : "Every one of those is already here.", "success");
        return;
      }
      addMoodboardItems(
        ws.id,
        board.id,
        palette.id,
        fresh.map((c) => ({ kind: "swatch" as const, hex: c.hex, name: c.name, size: "s" as const })),
      );
      showToast(
        isAr ? `${fresh.length} ألوان أضيفت إلى قسم الألوان.` : `${fresh.length} colours added to Palette.`,
        "success",
      );
    } finally {
      setBusyZone(null);
    }
  }

  /**
   * The palette zone, proposed.
   *
   * A proposal, not a write. Which of these is the brand's primary is a
   * decision a designer makes, and this is the point of the whole Drafts queue:
   * nothing reaches the brand without someone saying yes.
   */
  function proposePalette(zone: MoodboardZone) {
    if (!board) return;
    const swatches = zone.items
      .filter((i) => i.kind === "swatch" && i.hex)
      // The team's picks first, then the order they were put down in. That is
      // the closest thing the board has to an opinion about which is primary.
      .sort((a, b) => b.votes.length - a.votes.length || (a.order < b.order ? -1 : 1));

    if (swatches.length === 0) {
      showToast(isAr ? "لا توجد ألوان لاقتراحها." : "No colours here to propose.", "danger");
      return;
    }

    const fresh = swatches.filter(
      (s) => !ws.colors.some((c) => c.hex.toLowerCase() === s.hex!.toLowerCase()),
    );
    if (fresh.length === 0) {
      showToast(
        isAr ? "كل لون هنا موجود في اللوحة بالفعل." : "Every colour here is already in the palette.",
        "success",
      );
      return;
    }

    addDraft(ws.id, {
      targetType: "palette",
      targetRef: "colors",
      content: JSON.stringify(fresh.map((s) => ({ name: s.name || "Untitled", hex: s.hex }))),
      source: "palette",
      provenance: {
        summary: `${fresh.length} colour${fresh.length === 1 ? "" : "s"} from “${zone.title}” on “${board.title}”`,
        inputs: fresh.map((s) => `${s.name || "Untitled"} ${s.hex}`).slice(0, 8),
        requestedBy: me,
      },
    });
    showToast(
      isAr ? `${fresh.length} ألوان مقترحة — راجعها في المسودات.` : `${fresh.length} colours proposed — review them in Drafts.`,
      "success",
    );
  }

  /** The Words zone, proposed to the Voice matrix. */
  function proposeWords(zone: MoodboardZone) {
    if (!board) return;
    const notes = zone.items
      .filter((i) => i.kind === "note" && i.note?.trim())
      .sort((a, b) => b.votes.length - a.votes.length || (a.order < b.order ? -1 : 1));

    if (notes.length === 0) {
      showToast(isAr ? "لا توجد ملاحظات لإرسالها." : "Nothing written here to send.", "danger");
      return;
    }

    addDraft(ws.id, {
      targetType: "strategyField",
      targetRef: "voice",
      content: notes.map((n) => n.note!.trim()).join("\n"),
      source: "palette",
      provenance: {
        summary: `${notes.length} note${notes.length === 1 ? "" : "s"} from “${zone.title}” on “${board.title}”`,
        inputs: notes.map((n) => n.note!.trim().slice(0, 60)).slice(0, 8),
        requestedBy: me,
      },
    });
    showToast(
      isAr ? "أُرسلت إلى المسودات للمراجعة." : "Sent to Drafts for review.",
      "success",
    );
  }

  /* Renaming and deleting a zone are the same two actions in both views, so
     they live here rather than as closures inside whichever one is rendering. */

  async function renameZone(zone: MoodboardZone) {
    const title = await prompt({
      title: isAr ? "أعد تسمية القسم" : "Rename zone",
      label: isAr ? "العنوان" : "Title",
      initialValue: isAr && zone.arTitle ? zone.arTitle : zone.title,
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (!title?.trim() || !board) return;
    patchMoodboardZone(
      ws.id,
      board.id,
      zone.id,
      isAr ? { arTitle: title.trim() } : { title: title.trim() },
    );
  }

  async function removeZone(zone: MoodboardZone) {
    if (!board) return;
    const tray = board.zones.find((z) => z.kind === "unsorted" && z.id !== zone.id);
    const okToDelete = await confirm({
      title: isAr ? `حذف قسم “${zone.title}”؟` : `Delete the “${zone.title}” zone?`,
      body: isAr
        ? "تنتقل بطاقاته إلى «غير مصنّف». تبقى الصور في ملفات الهوية."
        : zone.items.length === 0
          ? "It's empty, so nothing moves."
          : tray
            ? `Its ${zone.items.length} card${zone.items.length === 1 ? "" : "s"} move to Unsorted rather than being deleted. Images stay in Brand files either way.`
            : `Its ${zone.items.length} card${zone.items.length === 1 ? "" : "s"} go with it — this board has no Unsorted tray to move them to. Images stay in Brand files.`,
      confirmLabel: isAr ? "حذف" : "Delete zone",
      tone: "danger",
      isAr,
    });
    if (okToDelete) removeMoodboardZone(ws.id, board.id, zone.id);
  }

  async function tidy() {
    if (!board) return;
    const ok = await confirm({
      title: isAr ? "ترتيب اللوح؟" : "Tidy the board?",
      body: isAr
        ? "تعود كل البطاقات إلى ترتيبها التلقائي داخل أقسامها. لا يُحذف شيء."
        : "Every card and frame goes back to its automatic position inside its zone. Nothing is deleted, and nothing is filed anywhere new — only the arrangement is reset.",
      confirmLabel: isAr ? "رتّب" : "Tidy up",
      isAr,
    });
    if (!ok) return;
    tidyMoodboard(ws.id, board.id);
    showToast(isAr ? "تم ترتيب اللوح." : "Board tidied.", "success");
  }

  function actionFor(zone: MoodboardZone): ZoneAction | undefined {
    if (zone.kind === "palette") {
      return {
        label: "Propose palette",
        arLabel: "اقترح اللوحة",
        icon: "palette",
        run: () => proposePalette(zone),
        busy: busyZone === zone.id,
      };
    }
    if (zone.kind === "words") {
      return {
        label: "Send to Voice",
        arLabel: "أرسل إلى الصوت",
        icon: "quote-right",
        run: () => proposeWords(zone),
      };
    }
    return undefined;
  }

  async function renameBoard() {
    if (!board) return;
    const title = await prompt({
      title: isAr ? "أعد تسمية اللوح" : "Rename board",
      label: isAr ? "الاسم" : "Name",
      initialValue: board.title,
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (title?.trim()) renameMoodboard(ws.id, board.id, title.trim());
  }

  async function addZone() {
    if (!board) return;
    const title = await prompt({
      title: isAr ? "قسم جديد" : "New zone",
      label: isAr ? "العنوان" : "Title",
      placeholder: isAr ? "الخامات" : "Materials",
      confirmLabel: isAr ? "إضافة" : "Add zone",
      isAr,
    });
    if (title?.trim()) addMoodboardZone(ws.id, board.id, title.trim());
  }

  async function deleteBoard() {
    if (!board) return;
    const count = board.zones.reduce((n, z) => n + z.items.length, 0);
    const okToDelete = await confirm({
      title: isAr ? `حذف “${board.title}”؟` : `Delete “${board.title}”?`,
      body: isAr
        ? "يُحذف اللوح. تبقى الصور في ملفات الهوية كاستكشاف، فلا يضيع شيء."
        : `The board goes${count ? `, with its ${count} card${count === 1 ? "" : "s"}` : ""}. The images stay in Brand files as exploration, so nothing is lost.`,
      confirmLabel: isAr ? "حذف اللوح" : "Delete board",
      tone: "danger",
      isAr,
    });
    if (okToDelete) {
      deleteMoodboard(ws.id, board.id);
      onActive(null);
      showToast(isAr ? "حُذف اللوح — الصور محفوظة." : "Board deleted — images kept.");
    }
  }

  async function labelEdge(edgeId: string) {
    if (!board) return;
    const current = (board.edges ?? []).find((e) => e.id === edgeId)?.label ?? "";
    const label = await prompt({
      title: isAr ? "سمِّ هذا الرابط" : "Name this connection",
      label: isAr ? "الوصف" : "Label",
      placeholder: isAr ? "يتناسب مع" : "pairs with",
      initialValue: current,
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (label !== null) labelMoodboardEdge(ws.id, board.id, edgeId, label.trim());
  }

  return {
    me,
    makeBoard,
    addCard: (zoneId: string, kind: MoodboardItem["kind"], at?: { x: number; y: number }) => void addCard(zoneId, kind, at),
    removeItems: handleRemoveItem,
    upload: (files: FileList, intoZoneId?: string | null) => void handleUpload(files, intoZoneId),
    sampleOne: (url: string) => void sampleOne(url),
    renameZone: (zone: MoodboardZone) => void renameZone(zone),
    removeZone: (zone: MoodboardZone) => void removeZone(zone),
    tidy: () => void tidy(),
    actionFor,
    renameBoard: () => void renameBoard(),
    addZone: () => void addZone(),
    deleteBoard: () => void deleteBoard(),
    labelEdge: (edgeId: string) => void labelEdge(edgeId),
  };
}

export type MoodboardActions = ReturnType<typeof useMoodboardActions>;
