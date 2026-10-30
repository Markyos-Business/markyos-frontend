import { describe, expect, it } from "vitest";
import type { BrandStrategy } from "@/types";
import { additionFor, isAdded, itemKey, mergeAdditions, noteFor, sectionItems } from "./toStrategy";
import type { Section } from "../types";

const src = (itemKey: string) => ({ analysisId: "a1", sectionKey: "goals", itemKey });
const evidence = { citations: [], basis: "inferred" as const, confidence: "high" as const };

describe("additionFor", () => {
  it("makes a goal an objective of the right kind", () =>
    expect(additionFor("goals.brand", { id: "g1", text: "Be the Riyadh coffee", priority: "high", ...evidence } as never, "en", src("g1"))).toEqual({
      objectives: [{ text: "Be the Riyadh coffee", kind: "brand", priority: "high", source: src("g1") }],
    }));

  it("writes an Arabic analysis into the Arabic fields", () => {
    const add = additionFor("goals.business", { id: "g2", text: "ضاعف المبيعات", priority: "low" } as never, "ar", src("g2"));
    expect(add.objectives?.[0]).toMatchObject({ text: "", textAr: "ضاعف المبيعات" });
  });

  it("folds a persona's details into role and description", () => {
    const add = additionFor(
      "audience.personas",
      { id: "p1", name: "Nour", job: "Designer", ageRange: "28–35", city: "Riyadh", needs: ["Speed"], frustrations: ["Queues"], quote: "I want it now", howTheyChoose: "By taste" } as never,
      "en",
      src("p1")
    );
    expect(add.personas?.[0]).toMatchObject({ name: "Nour", role: "Designer · 28–35 · Riyadh" });
    expect(add.personas?.[0].description).toBe("By taste\nNeeds: Speed\nFrustrations: Queues\n“I want it now”");
  });

  it("turns a route into a positioning option with its pros and risks as notes", () => {
    const add = additionFor("routes.items", { id: "r1", name: "Desert roast", idea: "Heritage", positioning: "For…", pros: ["Ownable"], risks: ["Niche"] } as never, "en", src("r1"));
    expect(add.positioningOptions?.[0]).toMatchObject({ name: "Desert roast", notes: ["Pro: Ownable", "Risk: Niche"] });
  });
});

describe("noteFor", () => {
  it("words a tension and a gap", () => {
    expect(noteFor("tensions.items", { statementA: { text: "Premium" }, statementB: { text: "Everyday" }, question: "Which wins?" } as never, "en")).toBe(
      "Tension: Premium ↔ Everyday. Which wins?"
    );
    expect(noteFor("gaps.items", { question: "What's the budget?" } as never, "ar")).toBe("سؤال مفتوح: What's the budget?");
  });
});

describe("isAdded", () => {
  const strategy = {
    objectives: [{ id: "x", text: "t", kind: "brand", priority: "high", source: { analysisId: "a1", sectionKey: "goals", itemKey: "g1" } }],
    personas: [],
    competitors: [],
    voiceTraits: [],
    positioningOptions: [{ id: "o", name: "", idea: "", positioning: "", notes: ["Open question: Budget?"] }],
    targetAudienceSummary: "Students: Young and online",
  } as unknown as BrandStrategy;

  it("knows an entry from the same analysis", () => {
    expect(isAdded(strategy, "goals.brand", { id: "g1" }, "a1", "en")).toBe(true);
    expect(isAdded(strategy, "goals.brand", { id: "g1" }, "another", "en")).toBe(false);
  });
  it("knows a segment already in the summary, and a note already on an option", () => {
    expect(isAdded(strategy, "audience.segments", { name: "Students", description: "Young and online" } as never, "a1", "en")).toBe(true);
    expect(isAdded(strategy, "gaps.items", { question: "Budget?" } as never, "a1", "en")).toBe(true);
  });
});

describe("sectionItems and mergeAdditions", () => {
  it("lists a section's mappable items", () => {
    const section = { key: "goals", current: { business: [{ id: "b" }], brand: [{ id: "c" }] } } as unknown as Section;
    expect(sectionItems(section).map((x) => [x.field, x.item.id])).toEqual([
      ["goals.business", "b"],
      ["goals.brand", "c"],
    ]);
    expect(sectionItems({ key: "snapshot", current: { facts: [] } } as unknown as Section)).toEqual([]);
  });

  it("merges lists and joins summaries", () => {
    const merged = mergeAdditions([
      { objectives: [{ text: "a", kind: "brand", priority: "low" }], audienceSummary: { text: "A", lang: "en" } },
      { objectives: [{ text: "b", kind: "brand", priority: "low" }], audienceSummary: { text: "B", lang: "en" } },
    ]);
    expect(merged.objectives?.map((o) => o.text)).toEqual(["a", "b"]);
    expect(merged.audienceSummary?.text).toBe("A\n\nB");
  });

  it("keys an item without an id by its wording", () => expect(itemKey("gaps.items", { question: "Budget?" })).toBe("gaps.items:Budget?"));
});
