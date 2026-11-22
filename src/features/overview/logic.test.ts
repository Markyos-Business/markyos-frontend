import { describe, expect, it } from "vitest";
import { overviewCopy } from "./copy";
import { actionHref, attentionHref, canEditRole, glanceSlots, isNewBrand, siteUrl, STEP_ORDER, stepHref, versionOf } from "./logic";
import type { Glance, OverviewData } from "./types";

const data = (over: Partial<OverviewData> = {}): OverviewData => ({
  workspaceType: "studio",
  role: "owner",
  demo: false,
  trimmed: false,
  header: { name: "Wadi Rum Coffee", initials: "WR", logo: "", tagline: { en: "", ar: "" } },
  site: { published: false, live: false, publishedAt: null, path: "/v/wadi", domain: "" },
  glance: null,
  steps: STEP_ORDER.map((key) => ({ key, state: "not_started" as const })),
  stage: "discover",
  mainAction: "send_form",
  attention: [],
  activity: [],
  ...over,
});

describe("Overview links", () => {
  it("every step opens its own page", () => {
    expect(STEP_ORDER.map((s) => stepHref("wadi", s))).toEqual([
      "/w/wadi/discovery",
      "/w/wadi/discovery?tab=analysis",
      "/w/wadi/strategy/positioning",
      "/w/wadi/moodboard",
      "/w/wadi/visual-identity",
      "/w/wadi/assets",
      "/w/wadi/builder",
      "/w/wadi/team",
    ]);
  });

  it("the main action follows the stage's key; handing off is a confirmation, not a page", () => {
    expect(actionHref("wadi", "send_form", "")).toBe("/w/wadi/discovery");
    expect(actionHref("wadi", "review_drafts", "")).toBe("/w/wadi/drafts");
    expect(actionHref("wadi", "build_guide", "")).toBe("/w/wadi/builder");
    expect(actionHref("wadi", "open_guide", "https://brand.example.com")).toBe("https://brand.example.com");
    expect(actionHref("wadi", "hand_off", "")).toBeNull();
  });

  it("attention items open where they are dealt with", () => {
    expect(attentionHref("wadi", { type: "drafts_waiting", at: 1, count: 2 })).toBe("/w/wadi/drafts");
    expect(attentionHref("wadi", { type: "approval_waiting", at: 1 })).toBe("/w/wadi/team");
    expect(attentionHref("wadi", { type: "form_answered", at: 1 })).toBe("/w/wadi/discovery");
  });

  it("the site is the verified domain, else /v/<slug> here", () => {
    expect(siteUrl(data().site, "https://app.markyos.com")).toBe("https://app.markyos.com/v/wadi");
    expect(siteUrl({ ...data().site, domain: "brand.wadi.sa" }, "https://app")).toBe("https://brand.wadi.sa");
  });
});

describe("Overview versions and roles", () => {
  it("studio and freelancer brands get the project overview; a company gets its brand home", () => {
    expect(versionOf("studio")).toBe("project");
    expect(versionOf("freelancer")).toBe("project");
    expect(versionOf("company")).toBe("home");
    expect(versionOf(undefined)).toBe("project");
  });

  it("only owners and editors act", () => {
    expect([canEditRole("owner"), canEditRole("editor"), canEditRole("viewer"), canEditRole("client")]).toEqual([true, true, false, false]);
  });
});

describe("Overview empty states", () => {
  it("a brand with nothing started is new: no empty widgets", () => {
    expect(isNewBrand(data())).toBe(true);
    expect(isNewBrand(data({ steps: [{ key: "discover", state: "in_progress" }] }))).toBe(false);
    expect(isNewBrand(data({ attention: [{ type: "drafts_waiting", at: 1, count: 1 }] }))).toBe(false);
    expect(isNewBrand(data({ site: { ...data().site, published: true } }))).toBe(false);
    // A failed block can't say it's empty, so its error shows instead of a bare page.
    expect(isNewBrand(data({ errors: ["activity"] }))).toBe(false);
  });

  it("knows which brand slots have data", () => {
    const g: Glance = {
      tagline: { en: "", ar: "" },
      positioning: { en: "", ar: "قهوة وادي رم" },
      voice: [],
      audience: { en: "", ar: "", personas: 2 },
      colors: [{ name: "Sand", hex: "#C2A878", primary: true }],
      logos: [],
      typefaces: { latin: "Inter", arabic: "" },
    };
    expect(glanceSlots(g)).toEqual({ positioning: true, voice: false, audience: true, colors: true, logos: false, typefaces: true });
    expect(Object.values(glanceSlots(null)).some(Boolean)).toBe(false);
  });
});

describe("Overview copy", () => {
  it("company copy never says client, studio or agency in Arabic", () => {
    const c = overviewCopy(true, true);
    // What the brand home shows: everything except the studio-only share-with-client header button.
    const shown = JSON.stringify({ ...c, header: { ...c.header, share: "" }, action: c.action }) +
      Object.values(c.attention.item).map((f) => f({ count: 3, title: "x", by: "y" })).join() +
      Object.values(c.activity).map((f) => f({ title: "x", by: "y" })).join();
    expect(shown).not.toMatch(/عميل|استوديو|وكالة/);
  });

  it("studio copy keeps the client", () => {
    expect(overviewCopy(true).header.share).toBe("مشاركة مع العميل");
    expect(overviewCopy(false).attention.empty).toBe("Nothing is waiting on you.");
    expect(overviewCopy(true).attention.empty).toBe("لا شيء بانتظارك");
  });
});
