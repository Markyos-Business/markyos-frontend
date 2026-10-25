import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "../mockData";
import { Asset, ShareLink, Workspace } from "../../../types";
import {
  addShareLinkTo,
  addWorkspaceTo,
  applySectionPatch,
  buildPublishedSnapshot,
  publishWorkspace,
  putAssetIn,
  removeAssetFrom,
  replaceWorkspaceIn,
  revokeShareLinkIn,
  unpublishWorkspace,
} from "./entityOps";

/**
 * `publish` decides what a client sees, and until these tests it was covered
 * only by a browser sweep — so a change to it failed slowly, in a suite that
 * needs a server, rather than in two seconds here.
 *
 * Fixtures start from the real seed rather than from a hand-written object.
 * `buildInitialWorkspaces` is one of the places the three-place invariant keeps
 * in step with the `Workspace` type, so a field added there cannot be silently
 * absent here — a hand-built fixture would drift the moment the type grew, and
 * these tests would keep passing against a shape the app no longer uses.
 */
const SEED = buildInitialWorkspaces();

function ws(patch: Partial<Workspace> = {}): Workspace {
  // Deep copy: several tests mutate their fixture to prove a snapshot does not
  // share references with it, and a shallow copy would leak that between tests.
  const base = JSON.parse(JSON.stringify(SEED[0])) as Workspace;
  return { ...base, slug: "test-brand", name: "Test Brand", published: null, publishedAt: null, ...patch };
}

function asset(id: string, patch: Partial<Asset> = {}): Asset {
  return {
    id,
    type: "photo",
    fileName: `${id}.jpg`,
    status: "approved",
    origin: "upload",
    sizeKB: 10,
    tags: [],
    uploadedAt: 0,
    versions: [],
    ...patch,
  } as Asset;
}

describe("buildPublishedSnapshot", () => {
  it("keeps approved assets", () => {
    const snap = buildPublishedSnapshot(ws({ assets: [asset("a"), asset("b")] }));
    expect(snap.assets.map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("drops exploration assets, because they are not the studio's to hand over", () => {
    const snap = buildPublishedSnapshot(
      ws({ assets: [asset("keep"), asset("explore", { status: "exploration" })] }),
    );
    expect(snap.assets.map((a) => a.id)).toEqual(["keep"]);
  });

  it("drops archived assets — retired from the brand is retired", () => {
    const snap = buildPublishedSnapshot(
      ws({ assets: [asset("keep"), asset("old", { status: "archived" })] }),
    );
    expect(snap.assets.map((a) => a.id)).toEqual(["keep"]);
  });

  it("empties every private collection", () => {
    const seeded = ws({
      moodboards: [{ id: "m", title: "Board", createdAt: 0, zones: [] }],
      drafts: [
        {
          id: "d",
          targetType: "strategyField",
          targetRef: "mission",
          content: { en: "x", ar: "" },
          source: "ai",
          status: "pending",
          createdAt: 0,
          provenance: { source: "ai" },
        } as never,
      ],
    });
    const snap = buildPublishedSnapshot(seeded);
    expect(snap.moodboards).toEqual([]);
    expect(snap.drafts).toEqual([]);
  });

  it("does not nest the previous snapshot inside the new one", () => {
    const first = publishWorkspace(ws(), 1000);
    const second = publishWorkspace(first, 2000);
    // If `published` were copied along, each publish would wrap the last and
    // the stored state would double in size every time.
    expect("published" in (second.published as object)).toBe(false);
    expect("publishedAt" in (second.published as object)).toBe(false);
  });

  it("is a copy, so editing the draft afterwards cannot change what is served", () => {
    const published = publishWorkspace(ws({ tagline: "before" }), 1000);
    const edited = { ...published, tagline: "after" };
    expect(edited.published?.tagline).toBe("before");
  });

  it("deep-copies, so a nested edit cannot reach the snapshot either", () => {
    const start = publishWorkspace(ws({ assets: [asset("a", { fileName: "one.jpg" })] }), 1000);
    // The shallow-copy bug this guards against: mutating an object *inside* a
    // collection the snapshot shares by reference.
    start.assets[0].fileName = "two.jpg";
    expect(start.published?.assets[0].fileName).toBe("one.jpg");
  });
});

describe("publish and unpublish", () => {
  it("stamps the time it was handed the clock, not one it read", () => {
    expect(publishWorkspace(ws(), 1234).publishedAt).toBe(1234);
  });

  it("unpublish clears the snapshot and leaves the draft alone", () => {
    const live = publishWorkspace(ws({ tagline: "kept" }), 1000);
    const offline = unpublishWorkspace(live);
    expect(offline.published).toBeNull();
    expect(offline.publishedAt).toBeNull();
    expect(offline.tagline).toBe("kept");
  });
});

describe("applySectionPatch", () => {
  it("sets a title in one language and keeps the other", () => {
    const a = applySectionPatch(ws(), "color", { title: { en: "Colour" } });
    const b = applySectionPatch(a, "color", { title: { ar: "الألوان" } });
    expect(b.sectionTitles.color).toEqual({ en: "Colour", ar: "الألوان" });
  });

  it("trims — a heading of three spaces is not a heading", () => {
    const a = applySectionPatch(ws(), "color", { title: { en: "  Colour  " } });
    expect(a.sectionTitles.color).toEqual({ en: "Colour" });
    const blank = applySectionPatch(ws(), "color", { title: { en: "   " } });
    expect("color" in blank.sectionTitles).toBe(false);
  });

  it("stores undefined rather than an empty string when one language is cleared", () => {
    const both = applySectionPatch(ws(), "color", { title: { en: "Colour", ar: "الألوان" } });
    const cleared = applySectionPatch(both, "color", { title: { en: "" } });
    // "" survives JSON.stringify and undefined does not, so storing the empty
    // string would leave the key in the snapshot forever.
    expect(cleared.sectionTitles.color?.en).toBeUndefined();
    expect(JSON.stringify(cleared.sectionTitles.color)).toBe('{"ar":"الألوان"}');
  });

  it("leaves the other language alone when only one is given", () => {
    const both = applySectionPatch(ws(), "color", { title: { en: "Colour", ar: "الألوان" } });
    const renamed = applySectionPatch(both, "color", { title: { ar: "لوحة" } });
    expect(renamed.sectionTitles.color).toEqual({ en: "Colour", ar: "لوحة" });
  });

  it("drops the key when a rename is cleared in both languages", () => {
    const named = applySectionPatch(ws(), "color", { title: { en: "Colour" } });
    const cleared = applySectionPatch(named, "color", { title: { en: "" } });
    // Not `{}` — an override that says nothing is not an override, and the
    // template's own heading has to be able to come back.
    expect("color" in cleared.sectionTitles).toBe(false);
  });

  it("null clears a style rather than merging it", () => {
    const styled = applySectionPatch(ws(), "color", { style: { align: "center" } });
    expect(styled.sectionStyles.color).toEqual({ align: "center" });
    const reset = applySectionPatch(styled, "color", { style: null });
    expect("color" in reset.sectionStyles).toBe(false);
  });

  it("keeps an empty options object, which is a real choice", () => {
    // `resolveOptions` treats a missing key as "fall back to the default" and
    // an empty array as "the studio turned everything off". The two must not
    // collapse into each other.
    const off = applySectionPatch(ws(), "color", { options: { formats: [] } });
    expect(off.sectionOptions.color).toEqual({ formats: [] });
  });

  it("hides and unhides without duplicating the id", () => {
    const hidden = applySectionPatch(applySectionPatch(ws(), "color", { hidden: true }), "color", {
      hidden: true,
    });
    expect(hidden.hiddenSections.filter((s) => s === "color")).toHaveLength(1);
    expect(applySectionPatch(hidden, "color", { hidden: false }).hiddenSections).not.toContain("color");
  });

  it("touches only the maps the patch names", () => {
    const start = applySectionPatch(ws(), "logo", { note: { en: "n" } });
    const next = applySectionPatch(start, "color", { hidden: true });
    expect(next.sectionNotes.logo).toEqual({ en: "n" });
  });
});

describe("putAssetIn", () => {
  // The seed brand ships with real assets, so these start from an empty list
  // to make the arithmetic readable rather than relative to whatever the seed
  // happens to carry.
  const empty = () => ws({ assets: [] });

  it("adds an asset that is not there", () => {
    expect(putAssetIn(empty(), asset("a")).assets.map((a) => a.id)).toEqual(["a"]);
  });

  it("replaces by id rather than appending, so a retried upload is not a duplicate", () => {
    const once = putAssetIn(empty(), asset("a", { fileName: "first.jpg" }));
    const twice = putAssetIn(once, asset("a", { fileName: "second.jpg" }));
    expect(twice.assets).toHaveLength(1);
    expect(twice.assets[0].fileName).toBe("second.jpg");
  });

  it("appends rather than replacing when the seed already holds other assets", () => {
    const seeded = ws();
    const before = seeded.assets.length;
    expect(putAssetIn(seeded, asset("new")).assets).toHaveLength(before + 1);
  });
});

describe("removeAssetFrom", () => {
  it("removes the asset", () => {
    const start = putAssetIn(ws({ assets: [] }), asset("a"));
    expect(removeAssetFrom(start, "a").assets).toHaveLength(0);
  });

  it("clears a typography font reference, so no section renders a hole", () => {
    const start = ws({ assets: [asset("f", { type: "font" })] });
    start.typography = { ...start.typography, latinFontAssetId: "f" };
    expect(removeAssetFrom(start, "f").typography.latinFontAssetId).toBeUndefined();
  });

  it("clears a department's attached guideline file", () => {
    const start = ws({ assets: [asset("doc", { type: "pdf" })] });
    start.departmentViews = [
      { id: "d", name: "Sales", items: [], guidelineText: "", instructionSections: [], publishToSite: true, guidelineFileAssetId: "doc", createdAt: 0 } as never,
    ];
    expect(removeAssetFrom(start, "doc").departmentViews[0].guidelineFileAssetId).toBeUndefined();
  });

  it("removes a moodboard card that is the asset and keeps a note that is not", () => {
    const start = ws({
      assets: [asset("img")],
      moodboards: [
        {
          id: "m",
          title: "Board",
          createdAt: 0,
          zones: [
            {
              id: "z",
              kind: "imagery",
              title: "Imagery",
              arTitle: "صور",
              order: 0,
              items: [
                { id: "i1", kind: "asset", assetId: "img", createdAt: 0 } as never,
                { id: "i2", kind: "note", createdAt: 0 } as never,
              ],
            } as never,
          ],
        },
      ],
    });
    const after = removeAssetFrom(start, "img");
    expect(after.moodboards[0].zones[0].items.map((i) => i.id)).toEqual(["i2"]);
  });

  it("leaves an unrelated asset alone", () => {
    const start = putAssetIn(putAssetIn(ws({ assets: [] }), asset("a")), asset("b"));
    expect(removeAssetFrom(start, "a").assets.map((x) => x.id)).toEqual(["b"]);
  });
});

describe("share links", () => {
  const link = (id: string, revokedAt: number | null = null): ShareLink => ({
    id,
    scope: "strategy",
    label: id,
    createdAt: 0,
    revokedAt,
  });

  it("adds a link", () => {
    expect(addShareLinkTo(ws(), link("one")).shareLinks).toHaveLength(1);
  });

  it("revokes by stamping rather than deleting", () => {
    const start = addShareLinkTo(ws(), link("one"));
    const after = revokeShareLinkIn(start, "one", 500);
    expect(after.shareLinks).toHaveLength(1);
    expect(after.shareLinks[0].revokedAt).toBe(500);
  });

  it("keeps the first revocation time, because that is when access ended", () => {
    const start = addShareLinkTo(ws(), link("one"));
    const once = revokeShareLinkIn(start, "one", 500);
    const twice = revokeShareLinkIn(once, "one", 900);
    expect(twice.shareLinks[0].revokedAt).toBe(500);
  });

  it("leaves other links untouched", () => {
    const start = addShareLinkTo(addShareLinkTo(ws(), link("one")), link("two"));
    const after = revokeShareLinkIn(start, "one", 500);
    expect(after.shareLinks.find((l) => l.id === "two")?.revokedAt).toBeNull();
  });
});

describe("workspace collection", () => {
  const state = (workspaces: Workspace[]) =>
    ({ session: null, accounts: [], resets: [], workspaces, auditLog: [], sso: {} }) as never;

  it("adds a workspace", () => {
    const next = addWorkspaceTo(state([]), ws({ slug: "a" }));
    expect(next.workspaces.map((w) => w.slug)).toEqual(["a"]);
  });

  it("refuses a duplicate slug, which is the client-facing URL", () => {
    const start = state([ws({ slug: "a" })]);
    const next = addWorkspaceTo(start, ws({ slug: "a" }));
    expect(next.workspaces).toHaveLength(1);
  });

  it("replaces one workspace and leaves the rest alone", () => {
    // Distinct ids, not just distinct slugs. The first version of this test
    // gave both fixtures the seed's id and `replaceWorkspaceIn` matched both —
    // which is the function behaving correctly on a fixture that was wrong.
    const one = ws({ id: "ws-one", slug: "a", name: "A" });
    const two = ws({ id: "ws-two", slug: "b", name: "B" });
    const next = replaceWorkspaceIn(state([one, two]), { ...one, name: "A2" });
    expect(next.workspaces.map((w) => w.name)).toEqual(["A2", "B"]);
  });

  it("matches on id and not on slug", () => {
    const one = ws({ id: "ws-one", slug: "same", name: "A" });
    const two = ws({ id: "ws-two", slug: "same", name: "B" });
    const next = replaceWorkspaceIn(state([one, two]), { ...two, name: "B2" });
    expect(next.workspaces.map((w) => w.name)).toEqual(["A", "B2"]);
  });
});
