import { describe, expect, it } from "vitest";
import { moveItem, selectionCount } from "./model";
describe("table selection scope", () => {
  it("counts remote matches without claiming all IDs are loaded", () => {
    expect(selectionCount(["loaded-1", "loaded-2"], { allMatching: true, excludedIds: ["locked", "excluded"] }, 480)).toBe(478);
    expect(selectionCount(["loaded-1"], { allMatching: false, excludedIds: [] }, 480)).toBe(1);
  });
  it("never produces a negative count after a changed server total", () => expect(selectionCount([], { allMatching: true, excludedIds: ["old-1", "old-2"] }, 1)).toBe(0));
});
describe("stable row and column reordering", () => {
  it("moves the requested item and keeps the caller's array immutable", () => {
    const rows = [{id:"riyadh"},{id:"dubai"},{id:"cairo"}];
    expect(moveItem(rows,0,2).map(row=>row.id)).toEqual(["dubai","cairo","riyadh"]);
    expect(rows.map(row=>row.id)).toEqual(["riyadh","dubai","cairo"]);
  });
  it.each([[-1,2],[0,-1],[0,3],[3,0],[1,1]])("ignores an invalid or unchanged move (%i,%i)", (from,to) => expect(moveItem(["a","b","c"],from,to)).toEqual(["a","b","c"]));
});
