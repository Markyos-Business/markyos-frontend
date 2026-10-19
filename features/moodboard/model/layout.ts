import type { Moodboard, MoodboardItem, MoodboardZone } from "@/core/data/types";

/**
 * Where everything sits on the board.
 *
 * The canvas needs a position for every zone and every card, and most boards
 * have never been arranged: one made before the canvas existed has no
 * coordinates at all, and a card added from the list view has none either. The
 * alternative to this file is a data migration that invents coordinates once,
 * at hydration, and has to be right first time for data nobody can inspect.
 *
 * So positions are *derived* instead, and only what somebody actually moved is
 * stored. That makes the migration a no-op, makes the layout re-runnable
 * ("Tidy up" is this function plus a write), and makes the arrangement of an
 * untouched board a property of the code rather than of whatever happened to be
 * written into storage the first time it was opened.
 *
 * Everything here is pure and deterministic: same board in, same geometry out,
 * every time. That is what lets the canvas be re-derived on every render
 * without anything jumping, and what lets a test assert a layout at all.
 */

/** Card footprints, by the size a card already carried in the list view. */
export const CARD_SIZE: Record<MoodboardItem["size"], { w: number; h: number }> = {
  s: { w: 180, h: 190 },
  m: { w: 240, h: 250 },
  l: { w: 380, h: 300 },
};

/** The gap between cards inside a zone, and between zones. */
export const GAP = 18;
/** The inset from a zone frame's edge to the first card inside it. */
export const ZONE_PAD = 16;
/** The zone frame's title bar. */
export const ZONE_HEADER = 42;
/**
 * The band under the header that an empty zone's instruction line sits in.
 *
 * Reserved only when the zone is showing ghost placeholders, because that is
 * the only time anything is drawn below the instructions. Three lines at
 * 11.5px/1.5 — every instruction in `templates.ts` runs to two at a default
 * frame width, so the third line is the headroom for a narrowed frame.
 */
export const ZONE_INSTRUCTION = 54;
/** A zone frame is this wide unless its contents force it wider. */
export const ZONE_WIDTH = 640;
/** Zones are laid out in this many columns before wrapping. */
export const ZONE_COLUMNS = 2;
/** An empty zone still has to be a droppable target of a sensible size. */
export const ZONE_MIN_BODY = 200;
/** Everything is snapped to this, so a dragged card lines up with its neighbours. */
export const SNAP = 8;

export function snap(value: number): number {
  return Math.round(value / SNAP) * SNAP;
}

/**
 * The same object with no stored position, so it falls back to the derived one.
 *
 * Deleting the keys rather than setting them to `undefined`: these are
 * `x?: number` and the difference between "absent" and "present and undefined"
 * is invisible in TypeScript and very visible in JSON. A board serialised with
 * `"x": undefined` round-trips through `JSON.stringify` fine and one written by
 * a future server would not.
 */
export function withoutPosition<T extends { x?: number; y?: number; w?: number; h?: number }>(
  value: T,
): T {
  const next: Record<string, unknown> = { ...value };
  delete next.x;
  delete next.y;
  delete next.w;
  delete next.h;
  return next as T;
}

export interface PlacedItem extends MoodboardItem {
  x: number;
  y: number;
  w: number;
  h: number;
  /** True when this position was derived here rather than stored on the card. */
  derived: boolean;
}

export interface PlacedZone extends Omit<MoodboardZone, "items"> {
  x: number;
  y: number;
  w: number;
  h: number;
  items: PlacedItem[];
  derived: boolean;
  /**
   * Where this zone's ghost placeholders go, when it is empty and the caller
   * supplied any. Geometry only — the hint each one carries belongs to the
   * template, and this file knows nothing about templates. Index-aligned with
   * whatever the caller passed to `ghostsFor`.
   */
  ghostBoxes: Array<{ x: number; y: number; w: number; h: number }>;
}

/**
 * The sizes of the ghost cards to show in an empty zone.
 *
 * Injected rather than imported, so this file stays a pure function of the
 * board: the template copy lives in `templates.ts`, and the geometry lives
 * here. A caller that passes nothing gets the old behaviour — an empty zone
 * sized to `ZONE_MIN_BODY` with nothing in it.
 */
export type GhostsFor = (zone: MoodboardZone) => Array<MoodboardItem["size"]>;

/** Zones in the order they are drawn: their own order, with the tray last. */
export function sortedZones(board: Moodboard): MoodboardZone[] {
  return [...board.zones].sort((a, b) => {
    // The tray is where a card goes when it has not been filed, so it belongs
    // at the end of the board however its order key happens to sort.
    if (a.kind === "unsorted" !== (b.kind === "unsorted")) return a.kind === "unsorted" ? 1 : -1;
    return a.order < b.order ? -1 : a.order > b.order ? 1 : 0;
  });
}

function sortedItems(zone: MoodboardZone): MoodboardItem[] {
  return [...zone.items].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
}

/**
 * Flows a zone's cards inside a frame of `innerWidth`, wrapping at the edge.
 *
 * A card that carries its own coordinates keeps them and takes no part in the
 * flow — it was put somewhere on purpose. The flow still runs for the rest,
 * which is what lets a half-arranged board stay usable instead of collapsing
 * every unplaced card onto the origin.
 */
function flowItems(
  items: MoodboardItem[],
  originX: number,
  originY: number,
  innerWidth: number,
): { placed: PlacedItem[]; height: number } {
  const placed: PlacedItem[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  let maxBottom = 0;

  for (const item of items) {
    const footprint = CARD_SIZE[item.size] ?? CARD_SIZE.m;
    const w = item.w ?? footprint.w;
    const h = item.h ?? footprint.h;

    if (item.x !== undefined && item.y !== undefined) {
      placed.push({ ...item, x: item.x, y: item.y, w, h, derived: false });
      maxBottom = Math.max(maxBottom, item.y - originY + h);
      continue;
    }

    if (cursorX > 0 && cursorX + w > innerWidth) {
      cursorX = 0;
      cursorY += rowHeight + GAP;
      rowHeight = 0;
    }
    placed.push({ ...item, x: originX + cursorX, y: originY + cursorY, w, h, derived: true });
    cursorX += w + GAP;
    rowHeight = Math.max(rowHeight, h);
    maxBottom = Math.max(maxBottom, cursorY + h);
  }

  return { placed, height: Math.max(maxBottom, ZONE_MIN_BODY) };
}

/**
 * Flows bare footprints through the same wrapping rule the cards use.
 *
 * This is what makes a ghost placeholder honest: same column, same size, same
 * wrap, so pressing one fills the hole it was drawn in rather than adding a
 * card somewhere else and rearranging the frame. The one difference is
 * vertical — ghosts sit a `ZONE_INSTRUCTION` band lower, under the line that
 * explains the zone, and that band goes away with the ghosts as soon as the
 * zone has a card in it.
 */
export function flowGhosts(
  sizes: Array<MoodboardItem["size"]>,
  originX: number,
  originY: number,
  innerWidth: number,
): { boxes: Array<{ x: number; y: number; w: number; h: number }>; height: number } {
  const boxes: Array<{ x: number; y: number; w: number; h: number }> = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  let maxBottom = 0;

  for (const size of sizes) {
    const { w, h } = CARD_SIZE[size] ?? CARD_SIZE.m;
    if (cursorX > 0 && cursorX + w > innerWidth) {
      cursorX = 0;
      cursorY += rowHeight + GAP;
      rowHeight = 0;
    }
    boxes.push({ x: originX + cursorX, y: originY + cursorY, w, h });
    cursorX += w + GAP;
    rowHeight = Math.max(rowHeight, h);
    maxBottom = Math.max(maxBottom, cursorY + h);
  }

  return { boxes, height: maxBottom };
}

/**
 * The whole board, positioned.
 *
 * Zones wrap across `ZONE_COLUMNS`, and a row is as tall as its tallest zone —
 * so the frames line up rather than interleaving, which is the difference
 * between a board and a pile of overlapping rectangles.
 */
export function placeBoard(board: Moodboard, ghostsFor?: GhostsFor): PlacedZone[] {
  const zones = sortedZones(board);

  // First pass: how tall is each zone, given its own cards — or, while it has
  // none, given the ghosts standing in for them. Sizing an empty frame to its
  // ghosts is what keeps the board's shape stable: the frame is already the
  // size the finished zone will be, so filling the first hole does not push
  // every other frame down the board.
  const sized = zones.map((zone) => {
    const items = sortedItems(zone);
    const width = zone.w ?? ZONE_WIDTH;
    const inner = width - ZONE_PAD * 2;
    const { height } = flowItems(items, 0, 0, inner);
    const ghosts = items.length === 0 && ghostsFor ? ghostsFor(zone) : [];
    const ghostHeight = ghosts.length ? ZONE_INSTRUCTION + flowGhosts(ghosts, 0, 0, inner).height : 0;
    return { zone, items, width, ghosts, bodyHeight: Math.max(height, ghostHeight) };
  });

  // Second pass: place the frames, then flow each zone's cards inside its frame.
  const out: PlacedZone[] = [];
  let rowTop = GAP;
  for (let i = 0; i < sized.length; i += ZONE_COLUMNS) {
    const row = sized.slice(i, i + ZONE_COLUMNS);
    const rowHeight = Math.max(...row.map((s) => s.bodyHeight)) + ZONE_HEADER + ZONE_PAD * 2;
    let left = GAP;
    for (const entry of row) {
      const x = entry.zone.x ?? left;
      const y = entry.zone.y ?? rowTop;
      const w = entry.zone.w ?? entry.width;
      const h = entry.zone.h ?? rowHeight;
      const inner = w - ZONE_PAD * 2;
      const { placed } = flowItems(entry.items, x + ZONE_PAD, y + ZONE_HEADER, inner);
      const ghostBoxes = entry.ghosts.length
        ? flowGhosts(entry.ghosts, x + ZONE_PAD, y + ZONE_HEADER + ZONE_INSTRUCTION, inner).boxes
        : [];
      out.push({
        ...entry.zone,
        x,
        y,
        w,
        h,
        items: placed,
        ghostBoxes,
        derived: entry.zone.x === undefined || entry.zone.y === undefined,
      });
      left += entry.width + GAP;
    }
    rowTop += rowHeight + GAP;
  }
  return out;
}

/** The bounding box of everything on the board, for zoom-to-fit. */
export function boardBounds(zones: PlacedZone[]): { x: number; y: number; w: number; h: number } {
  if (zones.length === 0) return { x: 0, y: 0, w: ZONE_WIDTH, h: 400 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const z of zones) {
    minX = Math.min(minX, z.x);
    minY = Math.min(minY, z.y);
    maxX = Math.max(maxX, z.x + z.w);
    maxY = Math.max(maxY, z.y + z.h);
    // A card dragged outside its frame still belongs to the board, so the
    // bounds have to include it or "fit" would scroll it off screen.
    for (const item of z.items) {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.w);
      maxY = Math.max(maxY, item.y + item.h);
    }
  }
  return { x: minX - GAP, y: minY - GAP, w: maxX - minX + GAP * 2, h: maxY - minY + GAP * 2 };
}

/**
 * Which zone a point lands in.
 *
 * Later zones win, so a frame drawn on top of another takes the drop — the same
 * rule the eye uses. Returns null for the open board, where a card sits in no
 * zone at all and keeps whichever one it came from.
 */
export function zoneAt(zones: PlacedZone[], x: number, y: number): PlacedZone | null {
  let hit: PlacedZone | null = null;
  for (const z of zones) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) hit = z;
  }
  return hit;
}

/**
 * The point on a card's edge that an edge-line should leave from.
 *
 * Drawn between centres and clipped to the boxes, so a connector touches the
 * two cards rather than disappearing under them. Without this every line
 * vanished the moment two cards were close together, which is exactly when a
 * connection is most worth seeing.
 */
export function edgeAnchor(
  from: { x: number; y: number; w: number; h: number },
  to: { x: number; y: number; w: number; h: number },
): { x: number; y: number } {
  const cx = from.x + from.w / 2;
  const cy = from.y + from.h / 2;
  const dx = to.x + to.w / 2 - cx;
  const dy = to.y + to.h / 2 - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  // Scale the direction vector until it hits whichever side it reaches first.
  const scaleX = dx === 0 ? Infinity : from.w / 2 / Math.abs(dx);
  const scaleY = dy === 0 ? Infinity : from.h / 2 / Math.abs(dy);
  const t = Math.min(scaleX, scaleY);
  return { x: cx + dx * t, y: cy + dy * t };
}
