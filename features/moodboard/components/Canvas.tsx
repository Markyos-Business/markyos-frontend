"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/shared/ui";
import { CardBody } from "./Card";
import { zoneSpecFor } from "@/features/moodboard/model/templates";
import {
  boardBounds,
  CARD_SIZE,
  edgeAnchor,
  GAP,
  placeBoard,
  snap,
  SNAP,
  ZONE_HEADER,
  type PlacedItem,
  type PlacedZone,
} from "@/features/moodboard/model/layout";
import type { Asset, Moodboard, MoodboardItem, MoodboardZone } from "@/core/data/types";

/**
 * The board as a board.
 *
 * Until now this page was an importer: files went in, and came back out as a
 * grid. That is a contact sheet. What a moodboard is *for* — the thing Milanote,
 * Miro and Canva's whiteboard all exist to support — is arranging: putting two
 * references next to each other because they belong next to each other, drawing
 * a line between a typeface and the photograph it was chosen for, ringing four
 * cards with a frame and calling it a direction. None of that is expressible in
 * a grid, because a grid decides the position and position is the content.
 *
 * So this is a real canvas: pan, zoom, free placement, resizing, frames, and
 * connections. Three things about how it is built are load-bearing:
 *
 * **Position is derived, not migrated.** Every card and frame has a place even
 * if nothing has ever been moved — `lib/moodboard/layout.ts` computes one — and
 * only what somebody actually dragged is stored. An old board opens arranged.
 *
 * **A zone is a region, not a band.** Dropping a swatch inside the Palette
 * frame is what files it under Palette. That is what keeps "propose this
 * palette" meaningful on a surface where anything can be anywhere: the board
 * stays typed while the arrangement stays free.
 *
 * **Dragging writes once.** The pointer moves sixty times a second and the
 * store persists to localStorage on every write, so a drag is held in local
 * state and committed on release. What is on screen during a drag is this
 * component's own arithmetic; what is in the store is where things came to
 * rest.
 */

/*
 * 0.1, not 0.2.
 *
 * "Fit the whole board" has to be able to keep its promise. A seven-zone
 * template board showing its ghost placeholders is about 2,900px tall, and a
 * canvas pane on a laptop is about 570px once the toolbar is out of the way —
 * so a floor of 0.2 meant Fit showed six sevenths of the board and called it
 * all of it, which is worse than not offering Fit. An overview is allowed to be
 * a thumbnail; that is what an overview is. Legibility is the *opening* view's
 * job, and it has its own floor below.
 */
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 2.5;
/**
 * The smallest zoom the board is allowed to *open* at.
 *
 * A fresh seven-zone board is about 1330×1190; a canvas pane on a laptop is
 * about 1160×660. Fitting all of that meant opening at 54%, where the zone
 * instructions — the sentences whose whole job is to teach the board — render
 * at six pixels. The board was legible only after the person found the zoom.
 *
 * So the opening view fits what it can above this floor and shows the top-left
 * of the board rather than the illegible whole of it. A person can always press
 * Fit, and then the overview is a thing they asked for and know how to undo.
 * This floor binds nothing else: Fit, the slider and ctrl+wheel still reach
 * ZOOM_MIN.
 */
const OPEN_ZOOM_MIN = 0.75;
/** The strip at the foot of the board the floating toolbar covers. */
const TOOLBAR_RESERVE = 72;
/** Anything smaller stops being a card and starts being a bug. */
const CARD_MIN = 80;
const ZONE_MIN_W = 240;
const ZONE_MIN_H = 140;
/** How far the pointer has to travel before a press becomes a drag. */
const DRAG_THRESHOLD = 3;

const ZONE_ICON: Record<string, string> = {
  imagery: "image",
  palette: "palette",
  type: "font",
  texture: "shapes",
  words: "quote-right",
  references: "link",
  unsorted: "inbox",
  custom: "th-large",
};

type Box = { x: number; y: number; w: number; h: number };

/**
 * Two boxes holding the same four numbers.
 *
 * Every render builds fresh box objects — a box is derived from the live
 * gesture or from the item's resting place, never stored — so a reference
 * comparison would report every card as changed on every pointer move, which is
 * exactly what the memo boundaries below exist to avoid.
 */
function sameBox(a: Box, b: Box): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

/**
 * Two placed cards carrying the same content.
 *
 * Compared field by field rather than by identity, because `placeBoard` builds
 * every `PlacedItem` afresh from the board — so one person voting on one card
 * gave all thirty-four new identities and redrew the whole canvas. Measured on
 * a 34-card board with the CPU throttled 6x, a single vote click cost a 1062ms
 * task. Every field is listed, including the ones the canvas does not draw: a
 * comparison that quietly calls two different cards equal shows stale content,
 * which is a far worse failure than a redraw that was not needed.
 */
function sameItem(a: PlacedItem, b: PlacedItem): boolean {
  return (
    a.id === b.id &&
    a.kind === b.kind &&
    a.assetId === b.assetId &&
    a.note === b.note &&
    a.arNote === b.arNote &&
    a.hex === b.hex &&
    a.name === b.name &&
    a.url === b.url &&
    a.order === b.order &&
    a.size === b.size &&
    a.x === b.x &&
    a.y === b.y &&
    a.w === b.w &&
    a.h === b.h &&
    a.derived === b.derived &&
    a.createdBy === b.createdBy &&
    a.createdAt === b.createdAt &&
    a.votes.length === b.votes.length &&
    a.votes.every((v, i) => v === b.votes[i])
  );
}

/**
 * What a press on the board means right now.
 *
 * A canvas has more gestures than a pointer has buttons, so the ones that
 * conflict are made into modes and put on a toolbar. Every one of them is also
 * reachable without the mode — a card drags under Select, the background pans
 * under Select, a card's own port connects under Select — because a mode you
 * have to be in is a mode you can be stuck in. The tools are the discoverable
 * route to the same gestures, and the only route to the ones with nowhere to
 * hang an affordance: placing a new card *somewhere specific*, and panning
 * across a board so full that there is no background left to grab.
 */
export type Tool = "select" | "pan" | "connect" | MoodboardItem["kind"];

const PLACE_TOOLS: MoodboardItem["kind"][] = ["note", "swatch", "asset", "link", "font"];

function isPlaceTool(tool: Tool): tool is MoodboardItem["kind"] {
  return (PLACE_TOOLS as string[]).includes(tool);
}

/** The cursor tells the truth about what the next press will do. */
function cursorFor(tool: Tool, gesture: Gesture["kind"]): string {
  if (gesture === "pan") return "grabbing";
  if (gesture === "marquee") return "crosshair";
  if (tool === "pan") return "grab";
  if (tool === "connect") return "crosshair";
  if (isPlaceTool(tool)) return "copy";
  return "grab";
}

/** The rubber band as a rectangle, whichever way it was dragged. */
/** Whether this press is asking to add to the selection rather than replace it. */
function extending(e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }): boolean {
  return e.shiftKey || e.metaKey || e.ctrlKey;
}

function marqueeBox(g: { from: { x: number; y: number }; to: { x: number; y: number } }): Box {
  return {
    x: Math.min(g.from.x, g.to.x),
    y: Math.min(g.from.y, g.to.y),
    w: Math.abs(g.to.x - g.from.x),
    h: Math.abs(g.to.y - g.from.y),
  };
}

type Gesture =
  | { kind: "none" }
  | { kind: "pan"; from: { x: number; y: number }; origin: { x: number; y: number } }
  /**
   * Moving one card, or every selected card at once.
   *
   * `id` and `box` are the card actually under the pointer — the one that
   * follows it exactly, so the gesture feels like dragging *that* thing. `start`
   * is where it began, and `others` is every other selected card's starting box.
   * Each of those is drawn and committed at its own start plus the same delta,
   * which is what keeps a group's internal arrangement intact: the point of
   * gathering five images and moving them together is that they stay arranged
   * the way you arranged them.
   */
  | {
      kind: "move-item";
      id: string;
      grab: { x: number; y: number };
      box: Box;
      start: Box;
      others: Array<{ id: string; box: Box }>;
      moved: boolean;
    }
  | { kind: "size-item"; id: string; box: Box; from: { x: number; y: number } }
  | { kind: "move-zone"; id: string; grab: { x: number; y: number }; box: Box; moved: boolean }
  | { kind: "size-zone"; id: string; box: Box; from: { x: number; y: number } }
  | { kind: "connect"; from: string; at: { x: number; y: number }; over: string | null }
  /**
   * The rubber band.
   *
   * Shift and drag on the background, because a plain background drag already
   * pans and that is the gesture this board is built on. Held in board
   * coordinates rather than client ones so the band stays over the same cards
   * if the view moves under it.
   */
  | { kind: "marquee"; from: { x: number; y: number }; to: { x: number; y: number }; add: string[] };

export interface CanvasProps {
  board: Moodboard;
  assets: Map<string, Asset>;
  isAr: boolean;
  me: string;
  /**
   * Every selected card.
   *
   * A list rather than one id, because a board is a place where things get
   * gathered: five images that belong together are moved together, and moving
   * them one at a time is how a group stops being a group. The last entry is
   * the anchor — the card a connection starts from and the one a shift-click
   * extends out of.
   */
  selected: string[];
  onSelect: (ids: string[]) => void;
  onPlaceItem: (itemId: string, at: Box, toZoneId?: string) => void;
  onPlaceZone: (zoneId: string, at: Box) => void;
  onConnect: (fromId: string, toId: string) => void;
  onRemoveEdge: (edgeId: string) => void;
  onLabelEdge: (edgeId: string) => void;
  onVote: (itemId: string) => void;
  /**
   * Takes cards off the board — one, or every selected one.
   *
   * A list rather than an id so a multi-card delete is one action with one
   * undo behind it, rather than five deletes and five toasts racing each other
   * off the screen.
   */
  onRemoveItem: (itemIds: string[]) => void;
  onEditItem: (itemId: string, patch: Partial<MoodboardItem>) => void;
  onAddCard: (zone: MoodboardZone, kind: MoodboardItem["kind"]) => void;
  onRenameZone: (zone: MoodboardZone) => void;
  onRemoveZone: (zone: MoodboardZone) => void;
  onSampleColor: (url: string) => void;
  /** Files dropped straight onto the board, with the zone they landed in. */
  onDropFiles: (files: FileList, zoneId: string | null) => void;
  /** The one thing a typed zone can do with its cards, if anything. */
  zoneAction: (zone: MoodboardZone) => { label: string; arLabel: string; icon: string; run: () => void; busy?: boolean } | undefined;
  /**
   * Puts a new card down at a point on the board, in whichever zone that point
   * is inside — or the tray, when it is on the open board.
   */
  onAddAt: (kind: MoodboardItem["kind"], zoneId: string | null, at: { x: number; y: number }) => void;
  onTidy: () => void;
  /** Whether the board has the window to itself. */
  fullscreen: boolean;
  onFullscreen: (next: boolean) => void;
}

export function Canvas(props: CanvasProps) {
  const { board, isAr, selected, onSelect } = props;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState({ x: 40, y: 40, zoom: 0.8 });
  const [gesture, setGesture] = useState<Gesture>({ kind: "none" });
  const [tool, setTool] = useState<Tool>("select");
  const fitted = useRef(false);

  /*
   * The ghosts an empty zone shows, looked up from the board's own template.
   *
   * This is the template keeping its promise. `templates.ts` says a template is
   * a method rather than a layout — typed zones with an instruction card in
   * each, so the board teaches its own use — and the list view has always shown
   * them. The canvas, which is the default view, showed seven empty rectangles
   * instead: it called `zoneSpecFor(undefined, …)`, which can only ever return
   * undefined, so the ghosts were looked up against no template at all.
   */
  const ghostsFor = useCallback(
    (zone: MoodboardZone) =>
      (zoneSpecFor(board.templateKey, zone.kind, zone.title)?.placeholders ?? []).map((p) => p.size),
    [board.templateKey],
  );
  const placed = useMemo(() => placeBoard(board, ghostsFor), [board, ghostsFor]);
  const itemsById = useMemo(() => {
    const map = new Map<string, { item: PlacedItem; zone: PlacedZone }>();
    for (const zone of placed) for (const item of zone.items) map.set(item.id, { item, zone });
    return map;
  }, [placed]);

  /*
   * The size of the window onto the board, tracked so the canvas can work out
   * what is actually in view. See `viewport` below.
   */
  const [hostSize, setHostSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() => {
      setHostSize((prev) =>
        prev.w === host.clientWidth && prev.h === host.clientHeight
          ? prev
          : { w: host.clientWidth, h: host.clientHeight },
      );
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  /*
   * What the window covers, in board coordinates, plus a margin.
   *
   * Cards outside it are not rendered at all. A board is an infinite surface
   * and a studio fills it: at 150 cards, **150 were in the DOM and 24 were on
   * screen**, and every one of the other 126 still cost an element, a memo
   * comparison on every frame of every gesture, and an image for the browser to
   * keep. Dragging a card on that board had a worst frame of 1.5 seconds.
   *
   * This is the "spatial culling" a Milanote-style canvas is built on, and it
   * is the one thing that makes the board scale with how much is on it rather
   * than with how much is visible.
   *
   * The margin is 40% of a screen in each direction, so cards mount before they
   * are reached and a pan does not pop them into place. It is measured in board
   * units, so it widens as you zoom out — which is right: zoomed out, a screen's
   * worth of pan covers more board. The figure is a balance rather than a guess:
   * at 0.75 a 150-card board still kept 70 cards mounted for 24 on screen, and
   * the margin costs area quadratically — 0.75 covers 6.25 screens, 0.4 covers
   * 3.2.
   *
   * Culling is a *rendering* decision only. Nothing here touches what is
   * stored, what is selected, or what the list view shows — which remains the
   * view that works without a pointer, and so the one a screen reader can walk
   * end to end.
   */
  const viewport = useMemo(() => {
    if (hostSize.w === 0 || hostSize.h === 0) return null;
    const padX = (hostSize.w * 0.4) / view.zoom;
    const padY = (hostSize.h * 0.4) / view.zoom;
    return {
      x0: -view.x / view.zoom - padX,
      y0: -view.y / view.zoom - padY,
      x1: (-view.x + hostSize.w) / view.zoom + padX,
      y1: (-view.y + hostSize.h) / view.zoom + padY,
    };
  }, [view, hostSize]);

  /*
   * The live pan and zoom, mirrored where a callback can read it without
   * depending on it.
   *
   * This is what made panning the one gesture the memo boundaries could not
   * help. `toBoard` needs the current view, so it listed `view` as a
   * dependency — and `view` changes on every frame of a pan. Every handler
   * built on `toBoard` therefore got a new identity thirty times a second,
   * which broke the prop comparison on every card and every frame at once.
   * Dragging a card was smooth because a card drag does not move the view;
   * panning re-rendered the whole board on every pointer move, and was
   * measurably the worst gesture on the canvas.
   *
   * Read through a ref, `toBoard` never changes, and a pan re-renders only the
   * one element whose transform actually moved.
   */
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /** Client coordinates → board coordinates. */
  const toBoard = useCallback(
    (clientX: number, clientY: number) => {
      const rect = hostRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const v = viewRef.current;
      return { x: (clientX - rect.left - v.x) / v.zoom, y: (clientY - rect.top - v.y) / v.zoom };
    },
    [],
  );

  /**
   * Frame the board.
   *
   * `floor` is the smallest zoom this particular call may choose. Fit — the
   * button — passes nothing and gets the whole board however small that is,
   * because that is what the person asked for. The opening view passes
   * `OPEN_ZOOM_MIN` and gets a legible board instead of a complete one.
   *
   * When the chosen zoom is too large to show everything, the view anchors to
   * the top-left of the content rather than centring it. Centring an overflowing
   * board hides the first zone behind the top edge and puts the middle of the
   * board where the beginning should be; anchoring puts the first thing first
   * and leaves the rest where scrolling will find it.
   */
  const fit = useCallback((floor = ZOOM_MIN) => {
    const host = hostRef.current;
    if (!host) return;
    const bounds = boardBounds(placed);
    // The usable height stops where the toolbar starts, or "fit the whole
    // board" fits the last row of it behind the toolbar.
    const usableH = Math.max(120, host.clientHeight - TOOLBAR_RESERVE);
    const zoom = Math.min(
      ZOOM_MAX,
      Math.max(floor, Math.min(host.clientWidth / bounds.w, usableH / bounds.h)),
    );
    const spareX = host.clientWidth - bounds.w * zoom;
    const spareY = host.clientHeight - bounds.h * zoom;
    setView({
      zoom,
      x: (spareX > 0 ? spareX / 2 : GAP) - bounds.x * zoom,
      // Centred vertically in the space above the toolbar, not in the whole
      // pane: the toolbar floats over the board, and framing the board behind it
      // puts a strip of content permanently under the one thing that never
      // moves.
      y: (spareY > TOOLBAR_RESERVE ? (spareY - TOOLBAR_RESERVE) / 2 : GAP) - bounds.y * zoom,
    });
  }, [placed]);

  /*
   * Fit once, when the board first has something in it.
   *
   * Only once: re-fitting on every change would fight the person, because
   * adding one card would move everything else they had just arranged. A ref
   * rather than state because "have we done this yet" is not something anything
   * renders — putting it in state would mean a render whose only job is to
   * record that a render already happened.
   *
   * The setState here is `fit` measuring the container, which is a DOM read
   * with no render-time equivalent: the element's size is not known until it
   * exists. That is the case the rule's own guidance carves out.
   */
  useEffect(() => {
    if (fitted.current || placed.length === 0) return;
    fitted.current = true;
    fit(OPEN_ZOOM_MIN);
  }, [placed.length, fit]);

  /*
   * Wheel, attached by hand rather than through `onWheel`.
   *
   * React registers wheel listeners passively, and a passive listener cannot
   * call `preventDefault` — so ctrl+wheel would zoom the canvas *and* the
   * browser, and a two-finger scroll over the board would scroll the page out
   * from under it. This is the one case where the native API is the only one
   * that can express what is needed.
   */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = host!.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        setView((v) => {
          const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.zoom * Math.exp(-e.deltaY / 320)));
          // Zoom about the pointer, so the thing under the cursor stays under
          // it. Zooming about the origin makes a board feel like it is running
          // away from you.
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          return {
            zoom: next,
            x: px - ((px - v.x) / v.zoom) * next,
            y: py - ((py - v.y) / v.zoom) * next,
          };
        });
        return;
      }
      setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    }
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, []);

  /*
   * Refit when the board gets the window to itself, and when it gives it back.
   *
   * Entering full screen roughly doubles the canvas and leaves the view where it
   * was, so a board that had been fitted to a 650px pane sits in the top-left
   * corner of a 950px one — which reads as the mode having done nothing. The
   * pan and zoom are the person's, but the size of the container is not.
   */
  const { fullscreen } = props;
  useEffect(() => {
    if (!fitted.current) return;
    // One frame, so the layout has actually changed size before it is measured.
    // Called through a closure rather than passed to rAF directly: rAF hands
    // its callback a timestamp, which `fit` would read as a zoom floor.
    const id = requestAnimationFrame(() => fit(OPEN_ZOOM_MIN));
    return () => cancelAnimationFrame(id);
  }, [fullscreen, fit]);

  // ------------------------------------------------------------ gestures ----

  /** Which zone a board-space point is inside. Later frames win, as the eye does. */
  const zoneAtPoint = useCallback(
    (x: number, y: number): PlacedZone | null => {
      let hit: PlacedZone | null = null;
      for (const z of placed) {
        if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) hit = z;
      }
      return hit;
    },
    [placed],
  );

  function beginPan(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setGesture({ kind: "pan", from: { x: e.clientX, y: e.clientY }, origin: { x: view.x, y: view.y } });
  }

  /**
   * What a press on a card does to the selection.
   *
   * Plain: this card alone — unless it is already part of the selection, in
   * which case the selection is left intact so that pressing one of five
   * gathered cards and dragging moves all five. Selecting the card under the
   * pointer there would silently drop the other four at the exact moment
   * somebody was about to move them.
   *
   * With shift or ⌘: toggle. Taking a card out of a selection needs to be the
   * same gesture as putting one in, or a mis-click costs the whole group.
   */
  const selectItem = useCallback(
    (id: string, e: React.PointerEvent | React.MouseEvent) => {
      if (extending(e)) {
        onSelect(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
        return;
      }
      if (!selected.includes(id)) onSelect([id]);
    },
    [selected, onSelect],
  );

  /*
   * ------------------------------------------------- handlers, held still ---
   *
   * Every one of these used to be written inline in the render, closing over
   * the card or zone it belonged to. That made a fresh function for all forty
   * children on every render, which meant the memo boundaries below could never
   * hold: a drag re-rendered the whole board thirty times a second, and the
   * board's own profile said so — 92% of a drag was script, with style recalc
   * and layout together under 1%. Measured with a 34-card board and the CPU
   * throttled 6x, a single pointer move cost 818ms.
   *
   * So they take the card or zone as an argument instead of capturing it. One
   * function serves every child, and it changes only when something it actually
   * reads changes — never merely because the pointer moved.
   */

  const grabItem = useCallback(
    (item: PlacedItem, e: React.PointerEvent, box: Box) => {
      /*
       * What a press on a card means depends on the tool.
       *
       * Pan and the placing tools fall through to the host, which is what makes
       * them work over a board so full that there is no background left to
       * press on — the case those tools exist for. Connect starts a connection
       * from anywhere on the card, so it does not depend on finding the 24px
       * port.
       */
      if (tool === "pan" || isPlaceTool(tool)) return;
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      selectItem(item.id, e);
      const at = toBoard(e.clientX, e.clientY);
      if (tool === "connect") {
        setGesture({
          kind: "connect",
          from: item.id,
          at: { x: box.x + box.w / 2, y: box.y + box.h / 2 },
          over: null,
        });
        return;
      }
      // Everything else already in the selection comes along. Read here, at the
      // press, because their start positions are what the whole drag is
      // computed from — and never while the press is extending the selection,
      // since shift-clicking to add a card is not a request to move the other
      // four.
      const others = extending(e)
        ? []
        : selected
            .filter((id) => id !== item.id && itemsById.has(id))
            .map((id) => {
              const o = itemsById.get(id)!.item;
              return { id, box: { x: o.x, y: o.y, w: o.w, h: o.h } };
            });
      setGesture({
        kind: "move-item",
        id: item.id,
        grab: { x: at.x - box.x, y: at.y - box.y },
        box,
        start: box,
        others,
        moved: false,
      });
    },
    [tool, selectItem, toBoard, selected, itemsById],
  );

  const sizeItem = useCallback(
    (id: string, e: React.PointerEvent, box: Box) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setGesture({ kind: "size-item", id, box, from: toBoard(e.clientX, e.clientY) });
    },
    [toBoard],
  );

  const connectFrom = useCallback((id: string, e: React.PointerEvent, box: Box) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setGesture({
      kind: "connect",
      from: id,
      at: { x: box.x + box.w / 2, y: box.y + box.h / 2 },
      over: null,
    });
  }, []);

  const { onVote, onRemoveItem, onEditItem, onSampleColor } = props;
  const voteItem = useCallback((id: string) => onVote(id), [onVote]);
  // The card's own × takes that card, even inside a selection — it is drawn on
  // one card and has to mean that one. Deleting the whole selection is Delete,
  // which is aimed at nothing in particular and so can mean all of it.
  const removeItem = useCallback((id: string) => onRemoveItem([id]), [onRemoveItem]);
  const editItem = useCallback(
    (id: string, patch: Partial<MoodboardItem>) => onEditItem(id, patch),
    [onEditItem],
  );

  const grabZone = useCallback(
    (zone: PlacedZone, e: React.PointerEvent, box: Box) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const at = toBoard(e.clientX, e.clientY);
      setGesture({
        kind: "move-zone",
        id: zone.id,
        grab: { x: at.x - box.x, y: at.y - box.y },
        box,
        moved: false,
      });
    },
    [toBoard],
  );

  const sizeZone = useCallback(
    (zone: PlacedZone, e: React.PointerEvent, box: Box) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setGesture({ kind: "size-zone", id: zone.id, box, from: toBoard(e.clientX, e.clientY) });
    },
    [toBoard],
  );

  const { onAddCard, onRenameZone, onRemoveZone } = props;
  const addToZone = useCallback(
    (zone: PlacedZone, kind: MoodboardItem["kind"]) => onAddCard(zone, kind),
    [onAddCard],
  );
  const renameZone = useCallback((zone: PlacedZone) => onRenameZone(zone), [onRenameZone]);
  const removeZone = useCallback((zone: PlacedZone) => onRemoveZone(zone), [onRemoveZone]);

  /**
   * A press on the board with a placing tool held.
   *
   * The card goes where it was clicked, in whichever frame that point is
   * inside — the same rule a dropped card follows, so "put a note here" and
   * "drag a note here" file it identically. The tool then returns to Select,
   * because a placing tool that stays armed turns every subsequent click into
   * another card, which is the single most common complaint about this pattern.
   */
  function placeNew(e: React.PointerEvent) {
    if (!isPlaceTool(tool)) return false;
    const at = toBoard(e.clientX, e.clientY);
    props.onAddAt(tool, zoneAtPoint(at.x, at.y)?.id ?? null, { x: snap(at.x), y: snap(at.y) });
    setTool("select");
    return true;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (gesture.kind === "none") return;

    // Pan works in client pixels and never asks where the pointer is on the
    // board, so it returns before `toBoard` is called at all. That also keeps
    // the one case where the view is moving away from the one reader of
    // `viewRef` — nothing can observe it a frame behind itself.
    if (gesture.kind === "pan") {
      setView((v) => ({
        ...v,
        x: gesture.origin.x + (e.clientX - gesture.from.x),
        y: gesture.origin.y + (e.clientY - gesture.from.y),
      }));
      return;
    }

    const at = toBoard(e.clientX, e.clientY);

    switch (gesture.kind) {
      case "move-item":
      case "move-zone": {
        const x = at.x - gesture.grab.x;
        const y = at.y - gesture.grab.y;
        const moved =
          gesture.moved ||
          Math.abs(x - gesture.box.x) > DRAG_THRESHOLD ||
          Math.abs(y - gesture.box.y) > DRAG_THRESHOLD;
        setGesture({ ...gesture, box: { ...gesture.box, x: snap(x), y: snap(y) }, moved });
        break;
      }
      case "marquee":
        setGesture({ ...gesture, to: at });
        break;
      case "size-item":
        setGesture({
          ...gesture,
          box: {
            ...gesture.box,
            w: Math.max(CARD_MIN, snap(at.x - gesture.box.x)),
            h: Math.max(CARD_MIN, snap(at.y - gesture.box.y)),
          },
        });
        break;
      case "size-zone":
        setGesture({
          ...gesture,
          box: {
            ...gesture.box,
            w: Math.max(ZONE_MIN_W, snap(at.x - gesture.box.x)),
            h: Math.max(ZONE_MIN_H, snap(at.y - gesture.box.y)),
          },
        });
        break;
      case "connect": {
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-mood-item]");
        const id = target?.getAttribute("data-mood-item") ?? null;
        setGesture({ ...gesture, at, over: id === gesture.from ? null : id });
        break;
      }
    }
  }

  function onPointerUp() {
    switch (gesture.kind) {
      case "move-item": {
        if (gesture.moved) {
          // Filed by where it landed. The centre rather than the corner,
          // because a big card overlapping two frames belongs to the one it is
          // mostly in — judging by the top-left files it by a pixel nobody is
          // looking at.
          const drop = (box: Box, id: string) => {
            const target = zoneAtPoint(box.x + box.w / 2, box.y + box.h / 2);
            props.onPlaceItem(id, box, target?.id);
          };
          drop(gesture.box, gesture.id);
          // Everything else in the selection moved by the same delta, and each
          // one is filed by where *it* landed — drag four cards across a frame
          // boundary and all four change zone, which is what "these belong
          // together" has to mean on a board where the frame is the filing.
          const dx = gesture.box.x - gesture.start.x;
          const dy = gesture.box.y - gesture.start.y;
          if (dx !== 0 || dy !== 0) {
            // Unsnapped, for the reason given in `boxOfItem`: the anchor snaps,
            // the group keeps its shape.
            for (const other of gesture.others) {
              drop({ ...other.box, x: other.box.x + dx, y: other.box.y + dy }, other.id);
            }
          }
        }
        break;
      }
      case "marquee": {
        const box = marqueeBox(gesture);
        const hit = placed
          .flatMap((z) => z.items)
          // Intersecting, not enclosing: on a board where cards are big and the
          // window is small, requiring full enclosure means scrolling out to
          // rope off something you can already see.
          .filter((i) => i.x < box.x + box.w && i.x + i.w > box.x && i.y < box.y + box.h && i.y + i.h > box.y)
          .map((i) => i.id);
        onSelect([...gesture.add, ...hit.filter((id) => !gesture.add.includes(id))]);
        break;
      }
      case "size-item":
        props.onPlaceItem(gesture.id, gesture.box);
        break;
      case "move-zone":
        if (gesture.moved) props.onPlaceZone(gesture.id, gesture.box);
        break;
      case "size-zone":
        props.onPlaceZone(gesture.id, gesture.box);
        break;
      case "connect":
        if (gesture.over) props.onConnect(gesture.from, gesture.over);
        break;
    }
    setGesture({ kind: "none" });
  }

  /** The box to draw something at: the live gesture's, or its resting place. */
  function boxOfItem(item: PlacedItem): Box {
    if ((gesture.kind === "move-item" || gesture.kind === "size-item") && gesture.id === item.id) {
      return gesture.box;
    }
    // Everything else in a group drag follows the card under the pointer by the
    // same offset, so the whole selection moves as the thing it is rather than
    // one card leaving the others behind until the mouse comes up.
    if (gesture.kind === "move-item") {
      const other = gesture.others.find((o) => o.id === item.id);
      if (other) {
        /*
         * The delta, unsnapped.
         *
         * Only the card under the pointer snaps to the grid; everything else
         * keeps its exact offset from it. Snapping each card separately looks
         * like the same thing and is not: two cards a person had lined up would
         * land in different grid cells and drift a few pixels apart on every
         * drag, so moving a row you had just straightened would bend it.
         */
        return {
          ...other.box,
          x: other.box.x + (gesture.box.x - gesture.start.x),
          y: other.box.y + (gesture.box.y - gesture.start.y),
        };
      }
    }
    return { x: item.x, y: item.y, w: item.w, h: item.h };
  }
  function boxOfZone(zone: PlacedZone): Box {
    if ((gesture.kind === "move-zone" || gesture.kind === "size-zone") && gesture.id === zone.id) {
      return gesture.box;
    }
    return { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
  }

  // ------------------------------------------------------------ keyboard ----

  /*
   * `fit` reached through a ref, not a dependency.
   *
   * The shortcut handler below already re-subscribes on every selection change;
   * adding `fit` — which changes whenever the board's geometry does — would put
   * a listener teardown behind every card that moves. The ref keeps that
   * effect's dependencies about what the effect is for.
   */
  const fitRef = useRef(fit);
  useEffect(() => {
    fitRef.current = fit;
  }, [fit]);

  /*
   * One key per tool, arrows nudge, Delete removes, Escape deselects.
   *
   * A freeform canvas is a pointer instrument — "drag this to roughly there" is
   * not a sentence a keyboard can say — so this is not an attempt to make
   * arranging fully keyboard-operable. It is the part that *can* be: once a
   * card is selected, moving it precisely is easier here than with a mouse.
   * Everything else on a board (adding, editing, voting, filing, proposing) is
   * reachable in the column view, which is why that view is kept.
   */
  useEffect(() => {
    function typing() {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA");
    }
    function onKey(e: KeyboardEvent) {
      if (typing()) return;
      /*
       * Escape unwinds one step at a time, innermost first.
       *
       * An armed tool, then full screen, then the selection. Doing all three at
       * once would mean pressing Escape to put a tool down also threw away the
       * mode and the selection — and Escape is the key people press when they
       * are not sure what state they are in, which is exactly when losing three
       * things at once is worst.
       */
      if (e.key === "Escape") {
        if (tool !== "select") {
          setTool("select");
          return;
        }
        if (props.fullscreen) {
          props.onFullscreen(false);
          return;
        }
        onSelect([]);
        return;
      }

      /*
       * One key per tool, the way every board tool works.
       *
       * V, H, N, S, I, L, T, C. Guarded on the modifiers so ⌘V still pastes and
       * ⌘S still saves the page; guarded on `typing()` above so writing the
       * letter "n" into a note stays writing the letter "n". The tooltips name
       * them, which is where somebody who has just used the button will see
       * them — a shortcut nobody can discover is a shortcut for the person who
       * wrote it.
       *
       * `f` is Fit rather than a tool: the one view command worth a key, since
       * the board opens legible rather than complete and "show me all of it" is
       * the question that follows.
       */
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "f") {
          e.preventDefault();
          fitRef.current();
          return;
        }
        const next = TOOL_BY_KEY[key];
        if (next) {
          e.preventDefault();
          setTool(next);
          return;
        }
      }

      // ⌘A selects every card on the board, which is the only way to say
      // "everything" on a surface bigger than the window.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        onSelect(placed.flatMap((z) => z.items).map((i) => i.id));
        return;
      }

      const live = selected.filter((id) => itemsById.has(id));
      if (live.length === 0) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        // One call for the whole selection, so one undo puts all of it back.
        props.onRemoveItem(live);
        onSelect([]);
        return;
      }

      const step = e.shiftKey ? 1 : SNAP;
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = delta[e.key];
      if (!move) return;
      e.preventDefault();
      // Every selected card by the same amount — nudging a group has to keep
      // it a group, exactly as dragging one does.
      for (const id of live) {
        const { item } = itemsById.get(id)!;
        props.onPlaceItem(id, {
          x: item.x + move[0],
          y: item.y + move[1],
          w: item.w,
          h: item.h,
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, itemsById, onSelect, props, tool, placed]);

  // ---------------------------------------------------------------- view ----

  const edges = board.edges ?? [];
  const connecting = gesture.kind === "connect" ? gesture : null;

  const zoomTo = useCallback((next: number) => {
    setView((v) => {
      const host = hostRef.current;
      const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      if (!host) return { ...v, zoom };
      // Zoom about the middle of what is on screen, for the same reason the
      // wheel zooms about the pointer.
      const cx = host.clientWidth / 2;
      const cy = host.clientHeight / 2;
      return { zoom, x: cx - ((cx - v.x) / v.zoom) * zoom, y: cy - ((cy - v.y) / v.zoom) * zoom };
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        ref={hostRef}
        data-moodboard-canvas
        // What the pointer is currently doing, published to the DOM. A drag is
        // several hundred events that leave no trace once they are over, so
        // without this a probe can only see whether the result was right and
        // never which part of the gesture went wrong.
        data-gesture={gesture.kind}
        data-tool={tool}
        role="application"
        aria-label={isAr ? `لوح ${board.title}` : `${board.title} board`}
        className={`relative flex-1 min-h-0 overflow-hidden ${
          // Full screen means edge to edge: a rounded card with a border inside
          // a window that has nothing else in it is a frame around nothing.
          fullscreen ? "" : "rounded-2xl mk-surface"
        }`}
        style={{
          background: "var(--surface-0)",
          // The dot grid is what tells you the surface is infinite and that
          // things are snapping to it. It scales with the zoom, so it reads as
          // part of the board rather than as a texture on the window.
          backgroundImage: "radial-gradient(circle, var(--hairline-strong) 1px, transparent 1px)",
          backgroundSize: `${SNAP * 3 * view.zoom}px ${SNAP * 3 * view.zoom}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
          cursor: cursorFor(tool, gesture.kind),
          touchAction: "none",
          // Only while the band is out. Notes on this board are editable text,
          // so the board cannot be permanently unselectable — but for the
          // length of a rubber-band drag it has to be, or the gesture selects
          // every word it passes over as well as the cards.
          userSelect: gesture.kind === "marquee" ? "none" : undefined,
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 && e.button !== 1) return;
          if (placeNew(e)) return;
          /*
           * Shift and drag ropes off an area; a plain drag pans.
           *
           * The other way round is what Miro does, and it is the wrong way
           * round here: this board's whole pan gesture is "drag the
           * background", documented as the reason the Pan tool only exists for
           * boards too full to have any background left. Taking that away to
           * make room for a marquee would break the gesture people already have
           * in their hands to add one they do not yet know about.
           */
          if (e.shiftKey && tool === "select") {
            e.stopPropagation();
            // Or the browser drags a text selection across the board at the
            // same time, and every zone title, instruction line and toolbar
            // label comes up highlighted behind the rubber band.
            e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            const at = toBoard(e.clientX, e.clientY);
            setGesture({ kind: "marquee", from: at, to: at, add: selected });
            return;
          }
          onSelect([]);
          beginPan(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (!e.dataTransfer.files?.length) return;
          e.preventDefault();
          const at = toBoard(e.clientX, e.clientY);
          props.onDropFiles(e.dataTransfer.files, zoneAtPoint(at.x, at.y)?.id ?? null);
        }}
      >
        {/*
          The board's coordinate space, which is physical in both languages.

          `left`, not `inset-inline-start` — and this is the case the opt-out
          exists for. A card at x=40 is forty pixels from the left of the board
          whichever way the language runs, because a board is a *space*, not a
          sentence: the frames, the cards and the connector geometry are all one
          set of numbers, and `translate()` is physical regardless.

          Anchoring this container logically while its children were positioned
          physically put the origin at the right edge in Arabic and laid the
          whole board out from there — off screen. An Arabic studio opened the
          board and saw an empty grid.
        */}
        <div
          style={{
            position: "absolute",
            left: 0, // physical-ok: board coordinates are a space, not a text flow
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          }}
        >
          {/* Frames first, so a card dragged out of one still draws over it. */}
          {placed.map((zone) => (
            <Frame
              key={zone.id}
              zone={zone}
              box={boxOfZone(zone)}
              isAr={isAr}
              templateKey={board.templateKey}
              action={props.zoneAction(zone)}
              onGrab={grabZone}
              onSize={sizeZone}
              onAdd={addToZone}
              onRename={renameZone}
              onRemove={removeZone}
            />
          ))}

          {/* Connections, under the cards: a line that crosses over a
              photograph reads as damage to the photograph. */}
          <Connections
            edges={edges}
            boxOf={(id) => {
              const entry = itemsById.get(id);
              return entry ? boxOfItem(entry.item) : null;
            }}
            pending={
              connecting
                ? { from: boxOfItem(itemsById.get(connecting.from)!.item), to: connecting.at, over: connecting.over }
                : null
            }
            isAr={isAr}
            onRemove={props.onRemoveEdge}
            onLabel={props.onLabelEdge}
          />

          {placed.map((zone) =>
            zone.items.map((item) => {
              const box = boxOfItem(item);
              const inGesture =
                (gesture.kind === "move-item" || gesture.kind === "size-item") &&
                (gesture.id === item.id ||
                  (gesture.kind === "move-item" && gesture.others.some((o) => o.id === item.id)));
              /*
               * Off-screen cards are not rendered. See `viewport`.
               *
               * Whatever a live gesture is touching is always drawn, however far
               * it has been taken: a card dragged past the edge of the window
               * must not vanish out of the hand holding it, and neither may the
               * rest of a group moving with it. The connection being drawn keeps
               * both of its ends for the same reason.
               */
              const keep =
                inGesture ||
                connecting?.from === item.id ||
                connecting?.over === item.id ||
                !viewport ||
                (box.x < viewport.x1 && box.x + box.w > viewport.x0 && box.y < viewport.y1 && box.y + box.h > viewport.y0);
              if (!keep) return null;
              return (
                <CardOnCanvas
                  key={item.id}
                  item={item}
                  box={box}
                  asset={item.assetId ? props.assets.get(item.assetId) : undefined}
                  isAr={isAr}
                  me={props.me}
                  tool={tool}
                  selected={selected.includes(item.id)}
                  connectTarget={connecting?.over === item.id}
                  dragging={gesture.kind === "move-item" && gesture.moved && inGesture}
                  onSelect={selectItem}
                  onGrab={grabItem}
                  onSize={sizeItem}
                  onConnectStart={connectFrom}
                  onVote={voteItem}
                  onRemove={removeItem}
                  onEdit={editItem}
                  onSampleColor={onSampleColor}
                />
              );
            }),
          )}

          {/* The rubber band, in board coordinates so it stays over the same
              cards if the view moves under it. */}
          {gesture.kind === "marquee" && (
            <div
              aria-hidden
              className="absolute rounded-sm pointer-events-none"
              style={{
                left: marqueeBox(gesture).x, // physical-ok: a board coordinate, not a text position
                top: marqueeBox(gesture).y,
                width: marqueeBox(gesture).w,
                height: marqueeBox(gesture).h,
                background: "var(--accent-soft)",
                boxShadow: "inset 0 0 0 1px var(--accent)",
              }}
            />
          )}
        </div>

        <BoardToolbar
          isAr={isAr}
          tool={tool}
          onTool={setTool}
          zoom={view.zoom}
          onZoom={zoomTo}
          onFit={fit}
          onTidy={props.onTidy}
          fullscreen={fullscreen}
          onFullscreen={props.onFullscreen}
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------- toolbar ----

interface ToolSpec {
  key: Tool;
  icon: string;
  label: string;
  arLabel: string;
  hint: string;
  arHint: string;
  /**
   * The single key that picks this tool.
   *
   * Every board tool in Miro, Figma and Canva has one, and reaching for the
   * pointer to change what the pointer does is the cost of not having them.
   * The letters are the ones those tools already use — V for select and H for
   * the hand are twenty years old and belong to the person's hands, not to any
   * one product. They are shown in the tooltip rather than printed on the
   * toolbar, so the toolbar teaches them at the moment someone is already
   * looking at the button.
   */
  shortcut: string;
}

const MODE_TOOLS: ToolSpec[] = [
  {
    key: "select",
    icon: "mouse-pointer",
    label: "Select",
    arLabel: "تحديد",
    hint: "Move cards and frames. Drag the background to pan, shift-drag to select several.",
    arHint: "حرّك البطاقات والأقسام. اسحب الخلفية للتحريك، ومع Shift لتحديد عدة بطاقات.",
    shortcut: "v",
  },
  {
    key: "pan",
    icon: "hand-paper",
    label: "Pan",
    arLabel: "تحريك",
    hint: "Drag anywhere to move the board — over cards too.",
    arHint: "اسحب من أي مكان لتحريك اللوح، حتى فوق البطاقات.",
    shortcut: "h",
  },
  {
    key: "connect",
    icon: "share-alt",
    label: "Connect",
    arLabel: "ربط",
    hint: "Drag from one card to another to link them.",
    arHint: "اسحب من بطاقة إلى أخرى لربطهما.",
    shortcut: "c",
  },
];

const PLACE_SPECS: ToolSpec[] = [
  {
    key: "note",
    icon: "sticky-note",
    label: "Note",
    arLabel: "ملاحظة",
    hint: "Click the board to write a thought there.",
    arHint: "اضغط على اللوح لكتابة فكرة هناك.",
    shortcut: "n",
  },
  {
    key: "swatch",
    icon: "swatchbook",
    label: "Colour",
    arLabel: "لون",
    hint: "Click the board to drop a colour there.",
    arHint: "اضغط على اللوح لإضافة لون هناك.",
    shortcut: "s",
  },
  {
    key: "asset",
    icon: "image",
    label: "Image",
    arLabel: "صورة",
    hint: "Click the board, then choose files.",
    arHint: "اضغط على اللوح ثم اختر الملفات.",
    shortcut: "i",
  },
  {
    key: "link",
    icon: "link",
    label: "Link",
    arLabel: "رابط",
    hint: "Click the board to paste a reference link there.",
    arHint: "اضغط على اللوح للصق رابط مرجعي هناك.",
    shortcut: "l",
  },
  {
    key: "font",
    icon: "font",
    label: "Typeface",
    arLabel: "خط",
    hint: "Click the board to put a typeface there.",
    arHint: "اضغط على اللوح لإضافة خط هناك.",
    shortcut: "t",
  },
];

/** Every tool the keyboard can reach, by the key that reaches it. */
const TOOL_BY_KEY: Record<string, Tool> = Object.fromEntries(
  [...MODE_TOOLS, ...PLACE_SPECS].map((t) => [t.shortcut, t.key]),
);

/**
 * The tools, along the bottom of the board.
 *
 * Bottom-centre rather than in the page header, and floating over the canvas
 * rather than above it, for three reasons that all point the same way. It is
 * where every canvas tool puts them, so it is where people look (Jakob's Law).
 * It stays with the board into full screen, where there is no page header left
 * to put anything in. And the distance from the board to its controls is the
 * distance the pointer travels between deciding and doing — Fitts's Law says
 * that is the number to shrink, and the bottom edge of the thing being worked on
 * is as close as it gets without covering it.
 *
 * Every button carries its own one-line explanation. A row of fourteen glyphs
 * with no words is a row nobody can read the first time, and this one has to
 * teach three gestures that have no other signpost.
 */
/**
 * The toolbar shows the tool and the zoom, and neither changes while a card is
 * being dragged — so it is memoized for the same reason the cards are: it was
 * rebuilding a dozen buttons on every pointer move to arrive at the same
 * markup. Every prop below is either a value or a callback the canvas holds
 * still, so the default shallow comparison is enough here.
 */
const BoardToolbar = memo(function BoardToolbar({
  isAr,
  tool,
  onTool,
  zoom,
  onZoom,
  onFit,
  onTidy,
  fullscreen,
  onFullscreen,
}: {
  isAr: boolean;
  tool: Tool;
  onTool: (next: Tool) => void;
  zoom: number;
  onZoom: (next: number) => void;
  onFit: () => void;
  onTidy: () => void;
  fullscreen: boolean;
  onFullscreen: (next: boolean) => void;
}) {
  function toolButton(spec: ToolSpec) {
    const active = tool === spec.key;
    const label = isAr ? spec.arLabel : spec.label;
    return (
      <button
        key={spec.key}
        type="button"
        onClick={() => onTool(active && spec.key !== "select" ? "select" : spec.key)}
        aria-pressed={active}
        aria-label={label}
        // `aria-keyshortcuts` rather than the key inside the name: the name is
        // what a screen reader reads every time the button is reached, and
        // "Colour S" is not what this control is called.
        aria-keyshortcuts={spec.shortcut.toUpperCase()}
        // For everyone else the key is in the tooltip, next to the button that
        // does the same thing — the one moment somebody is already looking at
        // this control and ready to learn the faster way to reach it.
        title={`${label} (${spec.shortcut.toUpperCase()}) — ${isAr ? spec.arHint : spec.hint}`}
        className="mk-icon-btn cursor-pointer"
        style={{
          background: active ? "var(--accent)" : "transparent",
          color: active ? "var(--accent-ink)" : "var(--text-muted)",
        }}
      >
        <Icon name={spec.icon} size={13} />
      </button>
    );
  }

  return (
    <div
      data-board-toolbar
      role="toolbar"
      aria-label={isAr ? "أدوات اللوح" : "Board tools"}
      // The board's own pointer handlers must not see these clicks, or pressing
      // "Note" would also place a note under the toolbar.
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute bottom-4 flex items-center gap-0.5 rounded-full px-1.5 py-1 max-w-[calc(100%-32px)] overflow-x-auto"
      style={{
        // Centred logically, so it stays centred in Arabic without a second
        // rule and without a physical `left`.
        insetInline: 0,
        marginInline: "auto",
        width: "fit-content",
        background: "var(--surface-2)",
        boxShadow: "inset 0 0 0 1px var(--hairline-strong), var(--shadow-modal)",
      }}
    >
      {MODE_TOOLS.map(toolButton)}
      <Separator />
      {PLACE_SPECS.map(toolButton)}
      <Separator />

      <button
        type="button"
        onClick={() => onZoom(zoom / 1.25)}
        aria-label={isAr ? "تصغير" : "Zoom out"}
        title={isAr ? "تصغير" : "Zoom out"}
        className="mk-icon-btn cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        <Icon name="minus" size={13} />
      </button>
      <button
        type="button"
        onClick={() => onZoom(1)}
        title={isAr ? "الحجم الأصلي" : "Back to actual size"}
        className="mk-tap px-1 text-[11px] font-semibold tabular-nums cursor-pointer justify-center"
        style={{ color: "var(--text-muted)", minWidth: 42 }}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={() => onZoom(zoom * 1.25)}
        aria-label={isAr ? "تكبير" : "Zoom in"}
        title={isAr ? "تكبير" : "Zoom in"}
        className="mk-icon-btn cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        <Icon name="plus" size={13} />
      </button>
      <button
        type="button"
        // Wrapped, not passed: `onFit` takes an optional zoom floor, and the
        // click event would arrive as one.
        onClick={() => onFit()}
        // Named for the sweeps, which drive this board in both languages and
        // cannot select it by a label that changes with the language.
        data-board-fit
        aria-label={isAr ? "إظهار اللوح كاملًا" : "Fit the whole board"}
        aria-keyshortcuts="F"
        title={isAr ? "إظهار اللوح كاملًا (F)" : "Fit the whole board on screen (F)"}
        className="mk-icon-btn cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        <Icon name="crosshairs" size={13} />
      </button>

      <Separator />

      <button
        type="button"
        onClick={onTidy}
        aria-label={isAr ? "ترتيب اللوح" : "Tidy the board"}
        title={
          isAr
            ? "ترتيب — تعود كل البطاقات إلى ترتيبها التلقائي"
            : "Tidy up — every card goes back to its automatic place"
        }
        className="mk-icon-btn cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        <Icon name="th-large" size={13} />
      </button>
      <button
        type="button"
        onClick={() => onFullscreen(!fullscreen)}
        aria-pressed={fullscreen}
        aria-label={isAr ? (fullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة") : fullscreen ? "Exit full screen" : "Full screen"}
        title={
          isAr
            ? fullscreen
              ? "إنهاء ملء الشاشة — Esc"
              : "ملء الشاشة — يُخفي القوائم ويصغّر الشريط الجانبي"
            : fullscreen
              ? "Exit full screen — Esc"
              : "Full screen — hides the page chrome and shrinks the sidebar"
        }
        className="mk-icon-btn cursor-pointer"
        style={{
          background: fullscreen ? "var(--accent-soft)" : "transparent",
          color: fullscreen ? "var(--accent-on-soft)" : "var(--text-muted)",
        }}
      >
        <Icon name={fullscreen ? "compress" : "expand-arrows-alt"} size={13} />
      </button>
    </div>
  );
});

function Separator() {
  return <span aria-hidden className="w-px h-5 mx-1 shrink-0" style={{ background: "var(--hairline-strong)" }} />;
}

// ---------------------------------------------------------------- frame ----

/**
 * A zone, drawn as a region of the board.
 *
 * It is a frame rather than a container in the DOM sense: the cards are
 * siblings of it, not children, because a card can be dragged half out of a
 * frame and still has to be drawn. Membership is decided by geometry on drop,
 * which is what makes the board both freeform and typed.
 */
interface FrameProps {
  zone: PlacedZone;
  box: Box;
  isAr: boolean;
  /** The board's template, which is where a zone's ghosts and copy come from. */
  templateKey?: string;
  action?: { label: string; arLabel: string; icon: string; run: () => void; busy?: boolean };
  /* Each takes its own zone rather than capturing one, so the canvas can hand
     the same function to all seven frames. See "handlers, held still". */
  onGrab: (zone: PlacedZone, e: React.PointerEvent, box: Box) => void;
  onSize: (zone: PlacedZone, e: React.PointerEvent, box: Box) => void;
  onAdd: (zone: PlacedZone, kind: MoodboardItem["kind"]) => void;
  onRename: (zone: PlacedZone) => void;
  onRemove: (zone: PlacedZone) => void;
}

function FrameBase({
  zone,
  box,
  isAr,
  templateKey,
  action,
  onGrab,
  onSize,
  onAdd,
  onRename,
  onRemove,
}: FrameProps) {
  const title = isAr && zone.arTitle ? zone.arTitle : zone.title;
  const spec = zoneSpecFor(templateKey, zone.kind, zone.title);
  const empty = zone.items.length === 0;
  const ghosts = empty ? (spec?.placeholders ?? []) : [];
  const instructions =
    (isAr ? zone.arInstructions : zone.instructions) ||
    (isAr ? "اسحب أي شيء إلى هنا." : "Drag anything in here.");

  return (
    <section
      aria-label={title}
      className="absolute rounded-2xl"
      style={{
        left: box.x, // physical-ok: a board coordinate, not a text position
        top: box.y,
        width: box.w,
        height: box.h,
        background: "var(--surface-1)",
        boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
      }}
    >
      <header
        className="absolute inset-x-0 top-0 flex items-center gap-2 px-3"
        style={{ height: ZONE_HEADER, cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => onGrab(zone, e, box)}
      >
        <Icon name={ZONE_ICON[zone.kind] ?? "th-large"} size={12} style={{ color: "var(--text-faint)" }} />
        <h2 dir="auto" className="bidi-auto text-[12.5px] font-semibold truncate">
          {title}
        </h2>
        <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
          {zone.items.length || ""}
        </span>

        <span
          className="ms-auto flex items-center gap-1"
          // The header is the drag handle, so its own controls have to opt out
          // or every click on them starts a drag instead.
          onPointerDown={(e) => e.stopPropagation()}
        >
          {action && (
            <button
              type="button"
              onClick={action.run}
              disabled={action.busy || empty}
              title={
                empty
                  ? isAr
                    ? "لا توجد بطاقات في هذا القسم بعد."
                    : "Nothing in this zone to propose yet."
                  : undefined
              }
              className="mk-tap h-6 px-2.5 rounded-full text-[10.5px] font-semibold cursor-pointer flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
            >
              <Icon name={action.icon} size={10} />
              {isAr ? action.arLabel : action.label}
            </button>
          )}
          <AddMenu zone={zone} isAr={isAr} onAdd={(kind) => onAdd(zone, kind)} />
          <button
            type="button"
            onClick={() => onRename(zone)}
            aria-label={isAr ? `أعد تسمية ${title}` : `Rename ${title}`}
            className="mk-icon-btn cursor-pointer"
          >
            <Icon name="pen" size={10} style={{ color: "var(--text-faint)" }} />
          </button>
          {zone.kind !== "unsorted" && (
            <button
              type="button"
              onClick={() => onRemove(zone)}
              aria-label={isAr ? `احذف قسم ${title}` : `Delete the ${title} zone`}
              className="mk-icon-btn mk-danger-hover cursor-pointer"
            >
              <Icon name="trash" size={10} style={{ color: "var(--text-faint)" }} />
            </button>
          )}
        </span>
      </header>

      {empty && (
        <p
          dir="auto"
          title={instructions}
          className="bidi-auto absolute inset-x-5 text-[11.5px] leading-[1.5] pointer-events-none"
          style={{
            top: ZONE_HEADER + 8,
            color: "var(--text-faint)",
            // Clamped only when there are ghosts under it, whose position is
            // computed against a fixed band. Three lines is more than any
            // instruction in `templates.ts` needs at a default frame width; a
            // frame narrowed by hand can reach it, and the title recovers it.
            ...(ghosts.length
              ? {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical" as const,
                  WebkitLineClamp: 3,
                  overflow: "hidden",
                }
              : null),
          }}
        >
          {instructions}
        </p>
      )}

      {/*
       * Ghost placeholders — what this zone is for, drawn where it will go.
       *
       * The board teaches its own use, which is the whole argument for a
       * template being a method rather than a layout. Each ghost stands in the
       * column and at the size the card it creates will have, so pressing one
       * fills the hole it was drawn in instead of adding a card somewhere else.
       * They exist only while the zone is empty and are never stored.
       */}
      {ghosts.map((ghost, i) => {
        const g = zone.ghostBoxes[i];
        if (!g) return null;
        return (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onAdd(zone, ghost.kind)}
            title={isAr ? `أضف: ${ghost.arHint}` : `Add: ${ghost.hint}`}
            /* No `mk-tap` here: it forces `display: inline-flex` to guarantee a
               26px tap target, and these are already 190px tall — all it did was
               beat the centring and leave the label off to one side. */
            className="absolute rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer p-3"
            style={{
              left: g.x - box.x, // physical-ok: a board coordinate, not a text position
              top: g.y - box.y,
              width: g.w,
              height: g.h,
              color: "var(--text-faint)",
              boxShadow: "inset 0 0 0 1px var(--hairline-strong)",
            }}
          >
            <Icon name="plus" size={14} />
            <span dir="auto" className="bidi-auto text-[11.5px] text-center leading-[1.4]">
              {isAr ? ghost.arHint : ghost.hint}
            </span>
          </button>
        );
      })}

      <span
        role="button"
        aria-label={isAr ? `غيّر حجم ${title}` : `Resize ${title}`}
        title={isAr ? "غيّر الحجم" : "Resize"}
        onPointerDown={(e) => onSize(zone, e, box)}
        className="absolute"
        /*
         * 24px of target around a 9px glyph. The corner used to be drawn at the
         * size of its icon, which is the same Fitts's Law failure as a 14px
         * close button — fine with a mouse on a desk, unusable with a thumb or a
         * trackpad at speed. WCAG 2.5.8 puts the floor at 24.
         *
         * Physically bottom-right in both languages, because the maths behind it
         * is: resizing computes `w = pointer.x - box.x`, which only describes a
         * handle on the far side of the box. Mirroring the handle without
         * mirroring the arithmetic would make an Arabic frame shrink as it was
         * dragged outward.
         */
        style={{
          right: 0, // physical-ok: paired with the resize maths, which is physical
          bottom: 0,
          width: 24,
          height: 24,
          cursor: "nwse-resize",
          touchAction: "none",
          color: "var(--text-faint)",
        }}
      >
        <Icon name="expand" size={9} style={{ position: "absolute", right: 5, bottom: 5 }} /* physical-ok: sits in the physical corner above */ />
      </span>
    </section>
  );
}

/**
 * A frame only redraws when something about *that frame* changed.
 *
 * `box` compares by value because it is rebuilt every render, and `action` by
 * its four visible fields rather than by identity: the page rebuilds the object
 * — and its `run` closure — on each of its own renders, but everything `run`
 * reads is derived from `zone`, and `placeBoard` gives every zone a new
 * identity whenever the board changes. So a `run` kept across a skipped render
 * can only be closing over data that has not moved.
 */
const Frame = memo(FrameBase, (a, b) => {
  if (a.zone !== b.zone || !sameBox(a.box, b.box)) return false;
  if (a.isAr !== b.isAr || a.templateKey !== b.templateKey) return false;
  if (
    a.action?.label !== b.action?.label ||
    a.action?.arLabel !== b.action?.arLabel ||
    a.action?.icon !== b.action?.icon ||
    a.action?.busy !== b.action?.busy
  ) {
    return false;
  }
  return (
    a.onGrab === b.onGrab &&
    a.onSize === b.onSize &&
    a.onAdd === b.onAdd &&
    a.onRename === b.onRename &&
    a.onRemove === b.onRemove
  );
});

/** What can go in this zone. Offered in the order the zone's job suggests. */
function AddMenu({
  zone,
  isAr,
  onAdd,
}: {
  zone: PlacedZone;
  isAr: boolean;
  onAdd: (kind: MoodboardItem["kind"]) => void;
}) {
  const [open, setOpen] = useState(false);

  const KINDS: Array<{ kind: MoodboardItem["kind"]; label: string; arLabel: string; icon: string }> = [
    { kind: "asset", label: "Image", arLabel: "صورة", icon: "image" },
    { kind: "swatch", label: "Colour", arLabel: "لون", icon: "swatchbook" },
    { kind: "note", label: "Note", arLabel: "ملاحظة", icon: "sticky-note" },
    { kind: "link", label: "Link", arLabel: "رابط", icon: "link" },
    { kind: "font", label: "Typeface", arLabel: "خط", icon: "font" },
  ];
  const preferred: Record<string, MoodboardItem["kind"]> = {
    palette: "swatch",
    words: "note",
    references: "link",
    type: "font",
  };
  const first = preferred[zone.kind];
  const ordered = first ? [...KINDS].sort((a, b) => (a.kind === first ? -1 : b.kind === first ? 1 : 0)) : KINDS;

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={isAr ? "أضف بطاقة" : "Add a card"}
        className="mk-icon-btn cursor-pointer"
      >
        <Icon name="plus" size={11} style={{ color: "var(--text-faint)" }} />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <span
            className="absolute z-20 flex flex-col rounded-xl overflow-hidden py-1 animate-pop"
            style={{
              insetInlineEnd: 0,
              top: "calc(100% + 4px)",
              minWidth: 150,
              background: "var(--surface-2)",
              boxShadow: "0 0 0 1px var(--hairline-strong), var(--shadow-pop)",
            }}
          >
            {ordered.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => {
                  onAdd(k.kind);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 h-8 px-3 text-[12px] cursor-pointer text-start"
                style={{ color: "var(--text)" }}
              >
                <Icon name={k.icon} size={12} style={{ color: "var(--text-faint)" }} />
                {isAr ? k.arLabel : k.label}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}

// ----------------------------------------------------------------- card ----

interface CardOnCanvasProps {
  item: PlacedItem;
  box: Box;
  asset?: Asset;
  isAr: boolean;
  me: string;
  tool: Tool;
  selected: boolean;
  connectTarget: boolean;
  dragging: boolean;
  /* Each takes the card's id — or the card — rather than capturing it, so the
     canvas hands one function to every card on the board instead of building
     thirty-four fresh closures per render. See "handlers, held still". */
  /** Takes the event too, because shift and ⌘ change what selecting means. */
  onSelect: (id: string, e: React.PointerEvent) => void;
  onGrab: (item: PlacedItem, e: React.PointerEvent, box: Box) => void;
  onSize: (id: string, e: React.PointerEvent, box: Box) => void;
  onConnectStart: (id: string, e: React.PointerEvent, box: Box) => void;
  onVote: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, patch: Partial<MoodboardItem>) => void;
  /** Only a photograph has a colour to take, so the card decides, not the caller. */
  onSampleColor?: (hex: string) => void;
}

function CardOnCanvasBase({
  item,
  box,
  asset,
  isAr,
  me,
  tool,
  selected,
  connectTarget,
  dragging,
  onSelect,
  onGrab,
  onSize,
  onConnectStart,
  onVote,
  onRemove,
  onEdit,
  onSampleColor,
}: CardOnCanvasProps) {
  const label = asset?.fileName ?? item.name ?? item.note?.slice(0, 40) ?? (isAr ? "بطاقة" : "card");
  const mine = item.votes.includes(me);
  /**
   * Text you can type into cannot also be a drag handle.
   *
   * Only the note, and only under Select. A swatch used to be here too, because
   * its face was a colour input covering the whole card — that has moved to a
   * corner control, which is what a square of colour needs anyway: something to
   * pick it up by.
   *
   * Under any other tool the note behaves like every other card, because a tool
   * that works on four kinds of card and silently not on the fifth is worse than
   * one that does not exist.
   */
  const inert = item.kind === "note" && tool === "select";

  return (
    <figure
      data-mood-item={item.id}
      // Published rather than inferred from the box shadow, which several other
      // states also change. `aria-selected` says the same thing to a screen
      // reader, which otherwise had no way to know a card was picked up.
      data-selected={selected || undefined}
      aria-selected={selected}
      aria-label={label}
      className="absolute rounded-xl overflow-hidden group"
      // Belt and braces after the `<img>` case: anything natively draggable
      // inside a card would otherwise hand the pointer to the browser's own
      // drag and cancel the gesture halfway through.
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{
        userSelect: inert ? undefined : "none",
        left: box.x, // physical-ok: a board coordinate, not a text position
        top: box.y,
        width: box.w,
        height: box.h,
        background: "var(--surface-1)",
        /*
         * The selection ring is *outside* the card, and solid.
         *
         * Two faults, both of which only mattered once more than one card could
         * be selected at a time. It was `--accent-edge`, a 55%-alpha wash that
         * reads as a slightly warmer border; and it was `inset`, which CSS
         * paints under the element's content — so on the board's commonest card,
         * an image filling its own frame, there was no ring at all. Selecting
         * five photographs looked exactly like selecting none of them.
         *
         * Drawn outside, nothing can cover it. The connect target gets a halo
         * as well, so a card that is both selected and about to receive a
         * connection still says which is which.
         */
        boxShadow: connectTarget
          ? "0 0 0 3px var(--accent), 0 0 0 7px var(--accent-soft), var(--shadow-pop)"
          : selected
            ? "0 0 0 2px var(--accent), var(--shadow-pop)"
            : "inset 0 0 0 1px var(--hairline-strong)",
        opacity: dragging ? 0.75 : 1,
        cursor: inert ? "default" : "grab",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        if (inert) {
          e.stopPropagation();
          onSelect(item.id, e);
          return;
        }
        onGrab(item, e, box);
      }}
    >
      <div className="w-full h-full overflow-hidden">
        <CardBody
          item={item}
          asset={asset}
          isAr={isAr}
          onEdit={(patch) => onEdit(item.id, patch)}
          // Only a photograph carries a colour worth lifting off it.
          onSampleColor={item.kind === "asset" ? onSampleColor : undefined}
          fill
        />
      </div>

      {/* A note and a swatch are typed into, so they get an explicit handle
          rather than being draggable by their whole face. */}
      {inert && (
        <span
          role="button"
          aria-label={isAr ? `اسحب ${label}` : `Drag ${label}`}
          title={isAr ? "اسحب للنقل" : "Drag to move"}
          onPointerDown={(e) => onGrab(item, e, box)}
          className="absolute top-1 h-6 w-6 grid place-items-center rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
          style={{ insetInlineStart: 4, cursor: "grab", touchAction: "none", background: "var(--scrim)", color: "var(--scrim-ink)" }}
        >
          <Icon name="grip-vertical" size={10} />
        </span>
      )}

      <span
        className="absolute top-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        style={{ insetInlineEnd: 4 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onVote(item.id)}
          aria-pressed={mine}
          aria-label={
            mine
              ? isAr ? `أزل اختيارك لـ ${label}` : `Remove your pick from ${label}`
              : isAr ? `اختر ${label}` : `Pick ${label}`
          }
          title={item.votes.length > 0 ? item.votes.join(", ") : isAr ? "لم يخترها أحد بعد" : "Nobody has picked this yet"}
          className="mk-tap h-6 px-2 rounded-full text-[10.5px] font-semibold cursor-pointer flex items-center gap-1"
          style={{
            background: mine ? "var(--accent)" : "var(--scrim)",
            color: mine ? "var(--accent-ink)" : "var(--scrim-ink)",
          }}
        >
          <Icon name="check" size={9} />
          {item.votes.length || ""}
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={isAr ? `احذف ${label} من اللوح` : `Take ${label} off the board`}
          title={isAr ? "حذف — يمكن التراجع" : "Delete — you can undo this"}
          // Named for the sweeps, which delete a specific card in both
          // languages and cannot select it by a label that changes with them.
          data-mood-remove
          className="mk-icon-btn cursor-pointer"
          style={{ background: "var(--scrim)", color: "var(--scrim-ink)" }}
        >
          <Icon name="times" size={10} />
        </button>
      </span>

      {/*
        The connection port.

        Revealed on hover of either card rather than only on the selected one:
        "drag from here to there" is a two-card gesture, and a port that appears
        only after a click makes the far end unreachable without letting go.

        Inside the card's own edge, not straddling it. The figure clips with
        `overflow: hidden` so the image can fill it, and a port hanging off the
        side was simply cut in half — invisible, and unhittable, while
        `getBoundingClientRect` still cheerfully reported a box for it.

        The target is 24px and the dot inside it is 12: Fitts's floor on the
        thing you have to grab, without a 24px blob sitting on the artwork.
      */}
      <span
        role="button"
        aria-label={isAr ? `اربط ${label} ببطاقة أخرى` : `Connect ${label} to another card`}
        title={isAr ? "اسحب إلى بطاقة أخرى للربط" : "Drag to another card to connect"}
        onPointerDown={(e) => onConnectStart(item.id, e, box)}
        className="absolute grid place-items-center opacity-0 group-hover:opacity-100 focus:opacity-100"
        style={{
          insetInlineEnd: 0,
          top: "50%",
          marginTop: -12,
          width: 24,
          height: 24,
          cursor: "crosshair",
          touchAction: "none",
        }}
      >
        <span
          className="rounded-full"
          style={{ width: 12, height: 12, background: "var(--accent)", boxShadow: "0 0 0 2px var(--surface-0)" }}
        />
      </span>

      <span
        role="button"
        aria-label={isAr ? `غيّر حجم ${label}` : `Resize ${label}`}
        title={isAr ? "غيّر الحجم" : "Resize"}
        onPointerDown={(e) => onSize(item.id, e, box)}
        className="absolute opacity-0 group-hover:opacity-100 focus:opacity-100"
        style={{
          right: 0, // physical-ok: paired with the resize maths, as on the frame
          bottom: 0,
          width: 24,
          height: 24,
          cursor: "nwse-resize",
          touchAction: "none",
          background: "var(--scrim)",
          color: "var(--scrim-ink)",
        }}
      >
        <Icon name="expand" size={9} style={{ position: "absolute", right: 5, bottom: 5 }} /* physical-ok: sits in the physical corner above */ />
      </span>
    </figure>
  );
}

/**
 * A card only redraws when something about *that card* changed.
 *
 * This is the boundary the whole drag rests on. Dragging one card changes one
 * card's box; without this, React re-rendered every card on the board on every
 * pointer move, and the other thirty-three produced byte-identical DOM for it.
 * `box` compares by value because it is derived, never stored.
 */
const CardOnCanvas = memo(
  CardOnCanvasBase,
  (a, b) =>
    sameItem(a.item, b.item) &&
    sameBox(a.box, b.box) &&
    a.asset === b.asset &&
    a.isAr === b.isAr &&
    a.me === b.me &&
    a.tool === b.tool &&
    a.selected === b.selected &&
    a.connectTarget === b.connectTarget &&
    a.dragging === b.dragging &&
    a.onSelect === b.onSelect &&
    a.onGrab === b.onGrab &&
    a.onSize === b.onSize &&
    a.onConnectStart === b.onConnectStart &&
    a.onVote === b.onVote &&
    a.onRemove === b.onRemove &&
    a.onEdit === b.onEdit &&
    a.onSampleColor === b.onSampleColor,
);

// ---------------------------------------------------------- connections ----

/**
 * The lines, and the one being drawn.
 *
 * An SVG overlay rather than positioned divs, because a connector is a curve
 * between two moving points and that is what SVG is. It is
 * `pointer-events: none` as a whole with the lines opting back in, so the huge
 * transparent rectangle it spans doesn't swallow every click on the board
 * underneath it — which it did, in the first version, and which looked exactly
 * like the canvas having stopped responding.
 */
function Connections({
  edges,
  boxOf,
  pending,
  isAr,
  onRemove,
  onLabel,
}: {
  edges: NonNullable<Moodboard["edges"]>;
  boxOf: (id: string) => Box | null;
  pending: { from: Box; to: { x: number; y: number }; over: string | null } | null;
  isAr: boolean;
  onRemove: (edgeId: string) => void;
  onLabel: (edgeId: string) => void;
}) {
  const drawn = edges
    .map((edge) => {
      const from = boxOf(edge.from);
      const to = boxOf(edge.to);
      if (!from || !to) return null;
      const a = edgeAnchor(from, to);
      const b = edgeAnchor(to, from);
      return { edge, a, b };
    })
    .filter((d): d is { edge: (typeof edges)[number]; a: { x: number; y: number }; b: { x: number; y: number } } => !!d);

  if (drawn.length === 0 && !pending) return null;

  // The overlay has to cover everything the lines touch, in both directions.
  const xs = drawn.flatMap((d) => [d.a.x, d.b.x]).concat(pending ? [pending.from.x, pending.to.x] : []);
  const ys = drawn.flatMap((d) => [d.a.y, d.b.y]).concat(pending ? [pending.from.y, pending.to.y] : []);
  const pad = GAP * 4;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const width = Math.max(...xs) - minX + pad;
  const height = Math.max(...ys) - minY + pad;

  return (
    <svg
      aria-hidden
      className="absolute pointer-events-none"
      style={{ left: minX, top: minY, width, height, overflow: "visible" }} /* physical-ok: same board coordinates as the cards it connects */
      viewBox={`${minX} ${minY} ${width} ${height}`}
      width={width}
      height={height}
    >
      <defs>
        <marker id="mk-mood-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--accent)" />
        </marker>
      </defs>

      {drawn.map(({ edge, a, b }) => {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={edge.id} className="pointer-events-auto">
            {/* A 14px transparent stroke under the visible 2px one. A 2px line
                is a 2px target, which is unhittable — the same Fitts problem as
                a 14px close button, and worse because there is nothing to aim
                at. */}
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="transparent"
              strokeWidth={14}
              style={{ cursor: "pointer" }}
              onClick={() => onLabel(edge.id)}
            />
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--accent)"
              strokeWidth={2}
              markerEnd="url(#mk-mood-arrow)"
              style={{ pointerEvents: "none" }}
            />
            {edge.label && (
              <text
                x={mx}
                y={my - 6}
                textAnchor="middle"
                fontSize={11}
                fill="var(--text-muted)"
                style={{ pointerEvents: "none" }}
              >
                {edge.label}
              </text>
            )}
            <g
              transform={`translate(${mx - 7}, ${my + 2})`}
              style={{ cursor: "pointer" }}
              onClick={() => onRemove(edge.id)}
            >
              <title>{isAr ? "احذف هذا الرابط" : "Remove this connection"}</title>
              <circle cx={7} cy={7} r={9} fill="var(--surface-2)" stroke="var(--hairline-strong)" />
              <path d="M4,4 L10,10 M10,4 L4,10" stroke="var(--text-muted)" strokeWidth={1.6} />
            </g>
          </g>
        );
      })}

      {pending && (
        <line
          x1={pending.from.x + pending.from.w / 2}
          y1={pending.from.y + pending.from.h / 2}
          x2={pending.to.x}
          y2={pending.to.y}
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="5 5"
          style={{ pointerEvents: "none" }}
        />
      )}
    </svg>
  );
}

export { CARD_SIZE };
