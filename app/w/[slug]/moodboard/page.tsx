"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/core/store/store";
import { useToast, useDialog, Icon, PillButton } from "@/shared/ui";
import { TopBar } from "@/features/workspace";
import { EmptyHint } from "@/shared/ui/composites/SectionUI/SectionUI";
import {
  Zone,
  type ZoneAction,
  Canvas,
  MOODBOARD_TEMPLATES,
  zoneForKind,
  sampleImage,
  fileToDownscaledDataUrl,
} from "@/features/moodboard";
import { Moodboard, MoodboardItem, MoodboardZone } from "@/core/data/types";
import { useLocalPref } from "@/shared/hooks/useLocalPref";

/**
 * Exploration, kept separate from the brand.
 *
 * Everything added here becomes an asset with EXPLORATION status, which is what
 * keeps it out of the published guideline, exports and share links — the publish
 * snapshot already filters on exactly that field, so no template has to know
 * this page exists. That matters more than it sounds: a moodboard is mostly
 * other people's photographs, and none of it is the studio's to hand over.
 *
 * The board is **zones**, not a wall of pictures. Milanote's insight is that a
 * template should be a method rather than a layout: typed bands with an
 * instruction card each, so the board teaches its own use. Markyos takes it one
 * step further — because a zone is typed, it can turn its cards into a
 * proposal. A palette zone knows its cards are colours, so it can offer them to
 * Visual Identity as a Draft. A pile of pictures can be admired; only a typed
 * board can become a brand.
 *
 * Still not a freeform canvas. A real-time multiplayer whiteboard is Miro's
 * job, and the decision that matters here is "which of these", not "where on
 * the page does it sit".
 */
export default function MoodboardPage() {
  const params = useParams<{ slug: string }>();
  const {
    getWorkspace,
    addAsset,
    createMoodboard,
    deleteMoodboard,
    renameMoodboard,
    addMoodboardZone,
    patchMoodboardZone,
    removeMoodboardZone,
    addMoodboardItems,
    updateMoodboardItem,
    moveMoodboardItem,
    removeMoodboardItem,
    restoreMoodboardItem,
    voteMoodboardItem,
    placeMoodboardItem,
    placeMoodboardZone,
    connectMoodboardItems,
    removeMoodboardEdge,
    labelMoodboardEdge,
    setMoodboardView,
    tidyMoodboard,
    addDraft,
    state,
    uiLang,
  } = useApp();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();
  const ws = getWorkspace(params.slug);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Which zone an upload started from, so files land where they were dropped. */
  const uploadZoneRef = useRef<string | null>(null);
  /** And where on the board, when the Image tool was used to place them. */
  const uploadAtRef = useRef<{ x: number; y: number } | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [busyZone, setBusyZone] = useState<string | null>(null);
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [picking, setPicking] = useState(false);
  /** The cards the canvas has selected, for nudging, deleting and connecting. */
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  /**
   * The board has the window to itself: page chrome gone, sidebar down to its
   * rail, and the browser's own chrome gone too where it is allowed.
   *
   * Session state, not a preference. Somebody who closes the tab mid-arrange and
   * comes back tomorrow should land on a normal page with its navigation, not on
   * a bare canvas wondering where the app went.
   */
  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalPref("markyos:ui:sidebar-collapsed", false);
  /** What the rail was before full screen took it, so exiting gives it back. */
  const railBefore = useRef(false);

  const board: Moodboard | null = useMemo(() => {
    if (!ws) return null;
    return ws.moodboards.find((b) => b.id === activeId) ?? ws.moodboards[0] ?? null;
  }, [ws, activeId]);

  /**
   * Full screen, applied.
   *
   * Written as an action rather than an effect on `fullscreen`, because it is
   * one: the rail's previous value has to be captured at the moment of the
   * click, and an effect that both reads and writes that value would re-run on
   * its own write and immediately give the rail back.
   *
   * The browser's own full screen is requested best-effort. It can be refused —
   * inside an iframe, under a permissions policy, or on a platform that has no
   * such mode — and the in-app half is the part that matters, so a refusal is
   * not worth a message. What is worth handling is the opposite direction: F11
   * or Esc leaves browser full screen without telling React, so `fullscreenchange`
   * brings the two back into agreement below.
   */
  const applyFullscreen = useCallback(
    (next: boolean) => {
      setFullscreen(next);
      if (next) {
        railBefore.current = sidebarCollapsed;
        setSidebarCollapsed(true);
        void document.documentElement.requestFullscreen?.().catch(() => {});
        return;
      }
      // Only give the rail back if we were the ones who took it.
      if (!railBefore.current) setSidebarCollapsed(false);
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    },
    [sidebarCollapsed, setSidebarCollapsed],
  );

  /*
   * The latest values, for a listener that is registered once.
   *
   * `fullscreenchange` and the unmount cleanup both have to see what is true
   * *now*, and re-registering the listener on every change would mean adding and
   * removing a document listener on every render. Written in an effect rather
   * than during render, which is the rule: a ref is not render output.
   */
  const fullscreenRef = useRef(false);
  const applyRef = useRef(applyFullscreen);
  useEffect(() => {
    fullscreenRef.current = fullscreen;
    applyRef.current = applyFullscreen;
  });

  useEffect(() => {
    function onChange() {
      // Left the browser's full screen by some other route — F11, Esc, the
      // window manager. The mode has to follow, or the page sits chrome-less in
      // a normal window with no obvious way back.
      if (!document.fullscreenElement && fullscreenRef.current) applyRef.current(false);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      // Navigating away while immersive must not leave the rail collapsed and
      // the browser in full screen with no board to justify either.
      if (fullscreenRef.current) applyRef.current(false);
    };
  }, []);

  if (!ws) return null;
  const isAr = uiLang(ws) === "ar";
  const me = state.session?.name ?? "You";
  const assets = new Map(ws.assets.map((a) => [a.id, a]));

  const zones = board
    ? [...board.zones].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0))
    : [];
  // A board made before the canvas existed has no `view`. The canvas is what a
  // moodboard is, so that is the default rather than the fallback.
  const view = board?.view ?? "canvas";
  /** The canvas is showing, so the page chrome gets out of its way. */
  const onCanvas = !!board && !picking && view === "canvas";
  const compact = onCanvas;
  /** Full screen only means anything while the canvas is the thing on screen. */
  const immersive = onCanvas && fullscreen;

  /** The shortlist: only what somebody spoke up for. */
  const visibleZones: MoodboardZone[] = shortlistOnly
    ? zones.map((z) => ({ ...z, items: z.items.filter((i) => i.votes.length > 0) }))
    : zones;

  function makeBoard(templateKey: string, title: string) {
    const id = createMoodboard(ws!.id, title, templateKey);
    setActiveId(id);
    setPicking(false);
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
      addMoodboardItems(ws!.id, board.id, zoneId, [{ kind: "swatch", hex: "#6b7280", size: "s", ...at }]);
      return;
    }

    if (kind === "note") {
      addMoodboardItems(ws!.id, board.id, zoneId, [{ kind: "note", note: "", ...at }]);
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
      addMoodboardItems(ws!.id, board.id, zoneId, [{ kind: "link", url: url.trim(), name: host, ...at }]);
      return;
    }

    if (kind === "font") {
      const fonts = ws!.assets.filter((a) => a.type === "font");
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
      addMoodboardItems(ws!.id, board.id, zoneId, [
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

    for (const itemId of itemIds) removeMoodboardItem(ws!.id, boardId, itemId);
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
          for (const r of removed) restoreMoodboardItem(ws!.id, boardId, r.zoneId, r.item, r.edges);
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
      const id = createMoodboard(ws!.id, isAr ? "استكشاف" : "Exploration", "brand-identity");
      setActiveId(id);
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
        addAsset(ws!.id, {
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
      ws!.id,
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
        ws!.id,
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
      (s) => !ws!.colors.some((c) => c.hex.toLowerCase() === s.hex!.toLowerCase()),
    );
    if (fresh.length === 0) {
      showToast(
        isAr ? "كل لون هنا موجود في اللوحة بالفعل." : "Every colour here is already in the palette.",
        "success",
      );
      return;
    }

    addDraft(ws!.id, {
      targetType: "palette",
      targetRef: "colors",
      content: JSON.stringify(fresh.map((s) => ({ name: s.name || "Untitled", hex: s.hex }))),
      source: "palette",
      provenance: {
        summary: `${fresh.length} colour${fresh.length === 1 ? "" : "s"} from “${zone.title}” on “${board!.title}”`,
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
    const notes = zone.items
      .filter((i) => i.kind === "note" && i.note?.trim())
      .sort((a, b) => b.votes.length - a.votes.length || (a.order < b.order ? -1 : 1));

    if (notes.length === 0) {
      showToast(isAr ? "لا توجد ملاحظات لإرسالها." : "Nothing written here to send.", "danger");
      return;
    }

    addDraft(ws!.id, {
      targetType: "strategyField",
      targetRef: "voice",
      content: notes.map((n) => n.note!.trim()).join("\n"),
      source: "palette",
      provenance: {
        summary: `${notes.length} note${notes.length === 1 ? "" : "s"} from “${zone.title}” on “${board!.title}”`,
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
      ws!.id,
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
    if (okToDelete) removeMoodboardZone(ws!.id, board.id, zone.id);
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
    tidyMoodboard(ws!.id, board.id);
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

  // --------------------------------------------------------------- view ----

  return (
    <>
      {/* In full screen the board is the only thing on the page. The breadcrumb,
          the title, the board switcher and the footnote are all navigation and
          explanation, and neither is what somebody arranging a board is doing. */}
      {!immersive && <TopBar workspace={ws} section="Moodboard" arSection="لوح الإلهام" />}
      {/* The canvas is its own scroll surface — it pans. Letting the page scroll
          underneath it as well would mean two things moving at once under one
          gesture, which is the fastest way to make a board feel broken. */}
      <div
        className={`flex-1 min-h-0 flex flex-col ${
          immersive ? "p-0 gap-0 overflow-hidden" : compact ? "px-7 py-4 gap-3 overflow-hidden" : "px-7 py-6.5 gap-5 overflow-auto"
        }`}
      >
        {/* The intro is onboarding, and the canvas needs the height more than a
            returning user needs the paragraph again. It stays on the list view
            and whenever there is no board yet, which is when it is being read. */}
        <div className="max-w-[860px] shrink-0" style={{ display: immersive ? "none" : undefined }}>
          <h1
            className={`font-semibold tracking-tight ${compact ? "text-[20px]" : "text-[30px] mb-1.5"}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isAr ? "لوح الإلهام" : "Moodboard"}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)", display: compact ? "none" : undefined }}>
            {isAr ? (
              <>
                اجمع المراجع، واتفق على اتجاه، ثم اقترح ما استقرّ عليه الفريق. كل ما هنا مُعلَّم{" "}
                <strong style={{ color: "var(--text-secondary)" }}>استكشافًا</strong> — لا يصل إلى الدليل
                المنشور ولا إلى التصدير ولا إلى رابط المشاركة.
              </>
            ) : (
              <>
                Gather references, agree on a direction, and propose what the team settled on. Everything
                here is marked <strong style={{ color: "var(--text-secondary)" }}>exploration</strong> — it
                never reaches the published guideline, an export, or a share link.
              </>
            )}
          </p>
        </div>

        {/* Board switcher */}
        <div className="flex items-center gap-2 flex-wrap shrink-0" style={{ display: immersive ? "none" : undefined }}>
          {ws.moodboards.map((b) => {
            const count = b.zones.reduce((n, z) => n + z.items.length, 0);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveId(b.id)}
                aria-pressed={board?.id === b.id}
                className="h-8 px-3.5 rounded-full text-[12px] font-semibold cursor-pointer"
                style={{
                  background: board?.id === b.id ? "var(--accent-soft)" : "var(--surface-1)",
                  color: board?.id === b.id ? "var(--accent-on-soft)" : "var(--text-muted)",
                }}
              >
                <span dir="auto" className="bidi-auto">{b.title}</span>
                {count > 0 && ` · ${count}`}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPicking((v) => !v)}
            aria-expanded={picking}
            className="mk-tap text-[12px] font-semibold cursor-pointer px-1"
            style={{ color: "var(--accent-text)" }}
          >
            {isAr ? "+ لوح جديد" : "+ New board"}
          </button>
        </div>

        {/* The input lives outside the board on purpose: uploading with no
            board yet creates one, so it has to exist before the first board
            does — otherwise the empty state tells someone to start and gives
            them nothing to start with. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleUpload(e.target.files);
            e.target.value = "";
          }}
        />

        {(picking || !board) && (
          <TemplatePicker isAr={isAr} onPick={makeBoard} onUpload={() => fileRef.current?.click()} hasBoard={!!board} />
        )}

        {board && !picking && (
          <>
            <div
              className="flex items-center gap-3 flex-wrap shrink-0"
              style={{ display: immersive ? "none" : undefined }}
            >
              <h2 dir="auto" className="bidi-auto text-[16px] font-semibold">{board.title}</h2>
              <button
                type="button"
                onClick={async () => {
                  const title = await prompt({
                    title: isAr ? "أعد تسمية اللوح" : "Rename board",
                    label: isAr ? "الاسم" : "Name",
                    initialValue: board.title,
                    confirmLabel: isAr ? "حفظ" : "Save",
                    isAr,
                  });
                  if (title?.trim()) renameMoodboard(ws.id, board.id, title.trim());
                }}
                aria-label={isAr ? "أعد تسمية اللوح" : "Rename board"}
                className="mk-icon-btn cursor-pointer"
              >
                <Icon name="pen" size={12} style={{ color: "var(--text-faint)" }} />
              </button>

              {/* Two ways to work the same board, not two features.
                  The canvas is where arranging happens and it is a pointer
                  instrument; the list is where everything else is, and it is
                  the one a keyboard can drive end to end. */}
              <div className="flex rounded-full p-0.5 ms-auto" style={{ background: "var(--surface-1)" }} role="tablist">
                {(
                  [
                    ["canvas", isAr ? "اللوح" : "Board", "th-large"],
                    ["columns", isAr ? "قائمة" : "List", "list"],
                  ] as const
                ).map(([key, label, icon]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={view === key}
                    onClick={() => setMoodboardView(ws.id, board.id, key)}
                    className="h-7 px-3 rounded-full text-[11px] font-semibold cursor-pointer flex items-center gap-1.5"
                    style={{
                      background: view === key ? "var(--surface-2)" : "transparent",
                      color: view === key ? "var(--text)" : "var(--text-faint)",
                    }}
                  >
                    <Icon name={icon} size={11} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tidy and the zoom controls moved onto the board's own toolbar,
                  which is where they have to be: in full screen this row does
                  not exist. The shortlist filter belongs to the list view and
                  stays here. */}
              {view === "columns" && (
                <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shortlistOnly}
                    onChange={(e) => setShortlistOnly(e.target.checked)}
                    className="cursor-pointer"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {isAr ? "المختارة فقط" : "Shortlist only"}
                </label>
              )}

              <button
                type="button"
                onClick={async () => {
                  const title = await prompt({
                    title: isAr ? "قسم جديد" : "New zone",
                    label: isAr ? "العنوان" : "Title",
                    placeholder: isAr ? "الخامات" : "Materials",
                    confirmLabel: isAr ? "إضافة" : "Add zone",
                    isAr,
                  });
                  if (title?.trim()) addMoodboardZone(ws.id, board.id, title.trim());
                }}
                className="mk-tap text-[12px] font-semibold cursor-pointer"
                style={{ color: "var(--accent-text)" }}
              >
                {isAr ? "+ قسم" : "+ Zone"}
              </button>
              {/* A rule between adding a zone and deleting the whole board.
                  They sat 12px apart in the same row at the same size, and the
                  only thing separating "make something" from "destroy
                  everything" was reading the label. */}
              <span aria-hidden className="w-px h-4 mx-1.5" style={{ background: "var(--hairline-strong)" }} />
              <button
                type="button"
                onClick={async () => {
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
                    setActiveId(null);
                    showToast(isAr ? "حُذف اللوح — الصور محفوظة." : "Board deleted — images kept.");
                  }
                }}
                className="mk-tap mk-danger-text text-[12px] cursor-pointer"
                style={{ color: "var(--text-faint)" }}
              >
                {isAr ? "حذف اللوح" : "Delete board"}
              </button>
            </div>

            {view === "canvas" ? (
              <Canvas
                board={board}
                assets={assets}
                isAr={isAr}
                me={me}
                selected={selectedCards}
                onSelect={setSelectedCards}
                onPlaceItem={(itemId, at, toZoneId) =>
                  placeMoodboardItem(ws.id, board.id, itemId, at, toZoneId)
                }
                onPlaceZone={(zoneId, at) => placeMoodboardZone(ws.id, board.id, zoneId, at)}
                onConnect={(from, to) => connectMoodboardItems(ws.id, board.id, from, to)}
                onRemoveEdge={(edgeId) => removeMoodboardEdge(ws.id, board.id, edgeId)}
                onLabelEdge={async (edgeId) => {
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
                }}
                onVote={(itemId) => voteMoodboardItem(ws.id, board.id, itemId)}
                onRemoveItem={handleRemoveItem}
                onEditItem={(itemId, patch) => updateMoodboardItem(ws.id, board.id, itemId, patch)}
                onAddCard={(zone, kind) => void addCard(zone.id, kind)}
                onAddAt={(kind, zoneId, at) =>
                  // No frame under the pointer means the open board. The card
                  // still has to belong somewhere, and the tray is the zone
                  // whose whole job is "not filed yet".
                  void addCard(zoneId ?? zoneForKind(board.zones, "unsorted")?.id ?? board.zones[0]?.id ?? "", kind, at)
                }
                onTidy={() => void tidy()}
                fullscreen={fullscreen}
                onFullscreen={applyFullscreen}
                onRenameZone={(zone) => void renameZone(zone)}
                onRemoveZone={(zone) => void removeZone(zone)}
                onSampleColor={(url) => void sampleOne(url)}
                onDropFiles={(files, zoneId) => void handleUpload(files, zoneId)}
                zoneAction={actionFor}
              />
            ) : (
              visibleZones.map((zone) => (
              <Zone
                key={zone.id}
                zone={zone}
                templateKey={board.templateKey}
                assets={assets}
                isAr={isAr}
                me={me}
                action={actionFor(zone)}
                draggingId={draggingId}
                onDragItem={setDraggingId}
                onDropInZone={(zoneId, beforeId) => {
                  if (!draggingId) return;
                  moveMoodboardItem(ws.id, board.id, draggingId, zoneId, beforeId);
                  setDraggingId(null);
                }}
                onVote={(itemId) => voteMoodboardItem(ws.id, board.id, itemId)}
                // The list view deletes one card at a time — it has no
                // selection — so it hands the same undo path a list of one.
                onRemoveItem={(itemId) => handleRemoveItem([itemId])}
                onEditItem={(itemId, patch) => updateMoodboardItem(ws.id, board.id, itemId, patch)}
                onAdd={(z, kind) => void addCard(z.id, kind)}
                onDismissInstructions={() =>
                  patchMoodboardZone(ws.id, board.id, zone.id, { instructionsDismissed: true })
                }
                onRename={() => void renameZone(zone)}
                onRemoveZone={() => void removeZone(zone)}
                onSampleColor={(url) => void sampleOne(url)}
              />
              ))
            )}

            <p
              className="text-[12px] max-w-[640px] shrink-0"
              style={{ color: "var(--text-faint)", display: immersive ? "none" : undefined }}
            >
              {isAr ? (
                <>
                  كل اقتراح من هنا يذهب إلى{" "}
                  <Link href={`/w/${ws.slug}/drafts`} style={{ color: "var(--accent-text)" }}>المسودات</Link>{" "}
                  — لا شيء يصل إلى الهوية حتى يوافق عليه شخص.
                </>
              ) : (
                <>
                  Everything proposed from this page lands in{" "}
                  <Link href={`/w/${ws.slug}/drafts`} style={{ color: "var(--accent-text)" }}>Drafts</Link> —
                  nothing reaches the brand until a person accepts it.
                </>
              )}
            </p>
          </>
        )}
      </div>
    </>
  );
}

/**
 * Starting a board is choosing a method.
 *
 * Offered as five named approaches rather than "new board", because the
 * difference between exploring a new brand and evolving an existing one is the
 * whole shape of the work — and a person who has to invent the zones
 * themselves will invent the same four every time.
 */
function TemplatePicker({
  isAr,
  onPick,
  onUpload,
  hasBoard,
}: {
  isAr: boolean;
  onPick: (templateKey: string, title: string) => void;
  onUpload: () => void;
  hasBoard: boolean;
}) {
  return (
    // Named, so a probe can reach the templates without matching a board that
    // happens to be called after the template it was made from.
    <div data-template-picker className="flex flex-col gap-3">
      {!hasBoard && (
        <EmptyHint>
          {isAr
            ? "لا توجد ألواح بعد. ابدأ من أحد الأساليب أدناه — كل قسم فيه يشرح ما يُوضع فيه."
            : "No boards yet. Start from one of these — every zone comes with a note on what belongs in it."}
        </EmptyHint>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-w-[900px]">
        {MOODBOARD_TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onPick(t.key, isAr ? t.arTitle : t.title)}
            className="mk-card flex items-start gap-2.5 rounded-xl p-3 text-start cursor-pointer"
            style={{ background: "var(--surface-1)" }}
          >
            <Icon name={t.icon} size={16} style={{ color: "var(--accent-text)", marginTop: 2, flexShrink: 0 }} />
            <span className="min-w-0">
              <span dir="auto" className="bidi-auto block text-[12.5px] font-medium">
                {isAr ? t.arTitle : t.title}
              </span>
              <span dir="auto" className="bidi-auto block text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                {isAr ? t.arDescription : t.description}
              </span>
              <span className="block text-[10.5px] mt-1" style={{ color: "var(--text-faint)" }}>
                {t.zones.map((z) => (isAr ? z.arTitle : z.title)).join(" · ")}
              </span>
            </span>
          </button>
        ))}
      </div>
      {!hasBoard && (
        <div>
          <PillButton variant="secondary" onClick={onUpload}>
            {isAr ? "أو ارفع مراجع مباشرة" : "Or just upload references"}
          </PillButton>
        </div>
      )}
    </div>
  );
}
