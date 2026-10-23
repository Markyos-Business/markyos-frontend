import { describe, expect, it } from "vitest";
import {
  boardBounds,
  CARD_SIZE,
  edgeAnchor,
  flowGhosts,
  GAP,
  placeBoard,
  snap,
  SNAP,
  sortedZones,
  withoutPosition,
  zoneAt,
  ZONE_COLUMNS,
  ZONE_HEADER,
  ZONE_INSTRUCTION,
  ZONE_PAD,
} from "./layout";
import type { Moodboard, MoodboardItem, MoodboardZone } from "@/types";

/**
 * The layout is the migration.
 *
 * Every board that existed before the canvas has no coordinates, and rather
 * than writing some into storage once and hoping they were right, positions are
 * derived from the board on every render. That makes this file the thing that
 * has to hold: if `placeBoard` is not a pure function of its input, cards move
 * on their own between renders, and no screenshot of a static board would show
 * it.
 */

let nextId = 0;
function item(over: Partial<MoodboardItem> = {}): MoodboardItem {
  nextId++;
  return {
    id: `i${nextId}`,
    kind: "note",
    order: `a${String(nextId).padStart(3, "0")}`,
    size: "m",
    votes: [],
    createdBy: "test",
    createdAt: 0,
    ...over,
  };
}

function zone(over: Partial<MoodboardZone> = {}): MoodboardZone {
  nextId++;
  return {
    id: `z${nextId}`,
    kind: "custom",
    title: `Zone ${nextId}`,
    arTitle: "",
    order: `a${String(nextId).padStart(3, "0")}`,
    items: [],
    ...over,
  };
}

function board(zones: MoodboardZone[]): Moodboard {
  return { id: "b1", title: "Board", createdAt: 0, zones };
}

describe("placeBoard", () => {
  it("gives every zone and every card a position, with nothing stored", () => {
    const placed = placeBoard(board([zone({ items: [item(), item()] }), zone({ items: [item()] })]));
    expect(placed).toHaveLength(2);
    for (const z of placed) {
      expect(Number.isFinite(z.x)).toBe(true);
      expect(Number.isFinite(z.y)).toBe(true);
      expect(z.w).toBeGreaterThan(0);
      expect(z.h).toBeGreaterThan(0);
      for (const card of z.items) {
        expect(Number.isFinite(card.x)).toBe(true);
        expect(Number.isFinite(card.y)).toBe(true);
        expect(card.derived).toBe(true);
      }
    }
  });

  /*
   * Ghosts.
   *
   * An empty zone draws the cards it is *for*, so the board teaches its own
   * use in the view people actually open. What makes them worth testing is that
   * they are not decoration: a ghost has to sit exactly where the card it makes
   * will land, and the frame has to already be the size the filled zone will
   * be — otherwise pressing one moves everything else on the board.
   */
  it("shows no ghosts unless asked, and none in a zone that has cards", () => {
    const empty = zone();
    const full = zone({ items: [item()] });
    const b = board([empty, full]);
    expect(placeBoard(b).every((z) => z.ghostBoxes.length === 0)).toBe(true);
    const withGhosts = placeBoard(b, () => ["m", "m"]);
    expect(withGhosts.find((z) => z.id === empty.id)!.ghostBoxes).toHaveLength(2);
    expect(withGhosts.find((z) => z.id === full.id)!.ghostBoxes).toHaveLength(0);
  });

  it("puts a ghost in the column and at the size the card will have", () => {
    const z = zone();
    const [ghosted] = placeBoard(board([z]), () => ["m"]);
    // Fill the same zone with one card of the same size, and the card lands on
    // the ghost's own footprint — minus the instruction band, which only a zone
    // showing ghosts reserves, and which goes away with them.
    const [filled] = placeBoard(board([{ ...z, items: [item({ size: "m" })] }]));
    const ghost = ghosted.ghostBoxes[0];
    const card = filled.items[0];
    expect({ x: ghost.x, w: ghost.w, h: ghost.h }).toEqual({ x: card.x, w: card.w, h: card.h });
    expect(ghost.y).toBe(card.y + ZONE_INSTRUCTION);
  });

  it("sizes an empty frame to the ghosts it is showing", () => {
    const z = zone();
    const [bare] = placeBoard(board([z]));
    const [ghosted] = placeBoard(board([z]), () => ["l", "m", "m"]);
    expect(ghosted.h).toBeGreaterThan(bare.h);
    // Every ghost is inside the frame it belongs to — the whole point of
    // sizing the frame to them.
    for (const g of ghosted.ghostBoxes) {
      expect(g.x).toBeGreaterThanOrEqual(ghosted.x);
      expect(g.x + g.w).toBeLessThanOrEqual(ghosted.x + ghosted.w);
      expect(g.y).toBeGreaterThanOrEqual(ghosted.y + ZONE_HEADER);
      expect(g.y + g.h).toBeLessThanOrEqual(ghosted.y + ghosted.h);
    }
  });

  it("stays a pure function once ghosts are involved", () => {
    const b = board([zone(), zone({ items: [item()] })]);
    const ghosts = () => ["s" as const, "l" as const];
    expect(placeBoard(b, ghosts)).toEqual(placeBoard(b, ghosts));
  });

  it("is a pure function of the board — same input, identical geometry", () => {
    const b = board([zone({ items: [item(), item(), item()] }), zone({ items: [item()] })]);
    expect(placeBoard(b)).toEqual(placeBoard(b));
  });

  it("keeps a stored position instead of flowing that card", () => {
    const fixed = item({ x: 999, y: 777, w: 120, h: 90 });
    const [z] = placeBoard(board([zone({ items: [item(), fixed] })]));
    const placed = z.items.find((i) => i.id === fixed.id)!;
    expect({ x: placed.x, y: placed.y, w: placed.w, h: placed.h }).toEqual({
      x: 999,
      y: 777,
      w: 120,
      h: 90,
    });
    expect(placed.derived).toBe(false);
    // The rest of the zone still flows, so a half-arranged board stays usable.
    expect(z.items.find((i) => i.id !== fixed.id)!.derived).toBe(true);
  });

  it("falls back to the card's size class when nothing is stored", () => {
    const [z] = placeBoard(board([zone({ items: [item({ size: "l" })] })]));
    expect({ w: z.items[0].w, h: z.items[0].h }).toEqual(CARD_SIZE.l);
  });

  it("wraps zones into rows without overlapping them", () => {
    const placed = placeBoard(board([zone(), zone(), zone(), zone()]));
    expect(placed).toHaveLength(4);
    // Row one and row two, given ZONE_COLUMNS of 2.
    const firstRow = placed.slice(0, ZONE_COLUMNS);
    const secondRow = placed.slice(ZONE_COLUMNS);
    expect(new Set(firstRow.map((z) => z.y)).size).toBe(1);
    const rowBottom = Math.max(...firstRow.map((z) => z.y + z.h));
    for (const z of secondRow) expect(z.y).toBeGreaterThanOrEqual(rowBottom);
    // And side by side within a row.
    expect(firstRow[1].x).toBeGreaterThanOrEqual(firstRow[0].x + firstRow[0].w);
  });

  it("puts every card inside its own frame", () => {
    const placed = placeBoard(board([zone({ items: [item(), item(), item(), item(), item()] })]));
    const z = placed[0];
    for (const card of z.items) {
      expect(card.x).toBeGreaterThanOrEqual(z.x);
      expect(card.y).toBeGreaterThanOrEqual(z.y);
      expect(card.y + card.h).toBeLessThanOrEqual(z.y + z.h);
    }
  });
});

describe("flowGhosts", () => {
  it("wraps at the edge, exactly as the cards do", () => {
    const inner = CARD_SIZE.m.w * 2 + GAP; // room for two, not three
    const { boxes } = flowGhosts(["m", "m", "m"], 0, 0, inner);
    expect(boxes[0].y).toBe(0);
    expect(boxes[1].y).toBe(0);
    expect(boxes[1].x).toBe(CARD_SIZE.m.w + GAP);
    // The third does not fit beside the second, so it starts a row.
    expect(boxes[2].x).toBe(0);
    expect(boxes[2].y).toBe(CARD_SIZE.m.h + GAP);
  });

  it("reports the height its own boxes need", () => {
    const { boxes, height } = flowGhosts(["l", "m"], 0, 0, 200);
    // 200px is narrower than either card, so each one takes its own row and the
    // height has to cover the last of them. A frame sized any shorter would cut
    // a ghost in half.
    expect(height).toBe(Math.max(...boxes.map((b) => b.y + b.h)));
  });

  it("is empty for an empty list, and costs no height", () => {
    expect(flowGhosts([], 10, 20, 600)).toEqual({ boxes: [], height: 0 });
  });

  it("offsets from the origin it is given", () => {
    const { boxes } = flowGhosts(["s"], ZONE_PAD, ZONE_HEADER, 600);
    expect(boxes[0]).toEqual({ x: ZONE_PAD, y: ZONE_HEADER, ...CARD_SIZE.s });
  });
});

describe("sortedZones", () => {
  it("keeps the tray last however its order key sorts", () => {
    const tray = zone({ kind: "unsorted", title: "Unsorted", order: "a000" });
    const other = zone({ order: "z999" });
    expect(sortedZones(board([tray, other])).map((z) => z.kind)).toEqual(["custom", "unsorted"]);
  });
});

describe("zoneAt", () => {
  const zones = placeBoard(board([zone({ title: "A" }), zone({ title: "B" })]));

  it("finds the zone a point is inside", () => {
    const a = zones[0];
    expect(zoneAt(zones, a.x + 10, a.y + 10)?.title).toBe("A");
  });

  it("returns null out on the open board, where a card keeps its zone", () => {
    expect(zoneAt(zones, -5000, -5000)).toBeNull();
  });

  it("gives an overlap to the frame drawn on top, the way the eye does", () => {
    const [a, b] = zones;
    const overlapping = [{ ...a }, { ...b, x: a.x, y: a.y, w: a.w, h: a.h }];
    expect(zoneAt(overlapping, a.x + 5, a.y + 5)?.title).toBe("B");
  });
});

describe("edgeAnchor", () => {
  const from = { x: 0, y: 0, w: 100, h: 100 };

  it("leaves from the side facing the other card", () => {
    const right = edgeAnchor(from, { x: 400, y: 0, w: 100, h: 100 });
    expect(right).toEqual({ x: 100, y: 50 });

    const below = edgeAnchor(from, { x: 0, y: 400, w: 100, h: 100 });
    expect(below).toEqual({ x: 50, y: 100 });
  });

  it("lands on the box edge rather than inside or beyond it", () => {
    const anchor = edgeAnchor(from, { x: 300, y: 200, w: 100, h: 100 });
    const onEdge =
      Math.abs(anchor.x - 100) < 0.001 ||
      Math.abs(anchor.y - 100) < 0.001 ||
      Math.abs(anchor.x) < 0.001 ||
      Math.abs(anchor.y) < 0.001;
    expect(onEdge).toBe(true);
  });

  it("does not divide by zero when two cards sit exactly on top of each other", () => {
    expect(edgeAnchor(from, from)).toEqual({ x: 50, y: 50 });
  });
});

describe("boardBounds", () => {
  it("includes a card dragged outside its own frame", () => {
    const stray = item({ x: -400, y: -300, w: 100, h: 100 });
    const placed = placeBoard(board([zone({ items: [stray] })]));
    const bounds = boardBounds(placed);
    expect(bounds.x).toBeLessThanOrEqual(-400);
    expect(bounds.y).toBeLessThanOrEqual(-300);
  });

  it("answers for an empty board rather than returning infinities", () => {
    const bounds = boardBounds([]);
    expect(Number.isFinite(bounds.w)).toBe(true);
    expect(bounds.h).toBeGreaterThan(0);
  });
});

describe("withoutPosition", () => {
  it("removes the keys rather than setting them to undefined", () => {
    const stripped = withoutPosition(item({ x: 10, y: 20, w: 30, h: 40 }));
    // `in` rather than a value check: `{x: undefined}` survives a round trip
    // through JSON.stringify as a *missing* key on the way out and a present
    // one on the way in, which is exactly the sort of difference that only
    // shows up once there is a server.
    expect("x" in stripped).toBe(false);
    expect("y" in stripped).toBe(false);
    expect("w" in stripped).toBe(false);
    expect("h" in stripped).toBe(false);
    expect(stripped.kind).toBe("note");
  });
});

describe("snap", () => {
  it("lands everything on the same grid the dots are drawn at", () => {
    expect(snap(0)).toBe(0);
    expect(snap(SNAP / 2 + 1) % SNAP).toBe(0);
    // `Math.abs`, because `-16 % 8` is `-0` and `toBe` is Object.is.
    expect(Math.abs(snap(-13) % SNAP)).toBe(0);
    expect(snap(-13)).toBe(-16);
  });
});
