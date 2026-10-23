import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "@/lib/data/mockData";
import type { Brief, Workspace } from "@/types";
import { briefProposals, withBriefProposals } from "./briefProposals";

function brief(extra: Partial<Brief> = {}): Brief {
  return {
    id: "br1",
    token: "t",
    label: "Kickoff",
    clientName: "Lina",
    template: "full",
    status: "submitted",
    questions: ["why-exists", "where-going"],
    lang: "en",
    answers: [
      { questionKey: "why-exists", value: "  To help  ", answeredAt: 1 },
      { questionKey: "where-going", value: "   ", answeredAt: 1 },
    ],
    createdAt: 1,
    sentAt: 1,
    submittedAt: 2,
    revokedAt: null,
    ...extra,
  } as Brief;
}

function workspace(briefs: Brief[]): Workspace {
  const [ws] = buildInitialWorkspaces();
  return { ...ws, briefs, drafts: [] };
}

describe("briefProposals", () => {
  it("proposes each answered strategy question, trimmed, and skips blanks", () => {
    const drafts = briefProposals(brief(), 5);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      targetRef: "purpose",
      content: "To help",
      source: "brief",
      status: "pending",
      createdAt: 5,
      provenance: { requestedBy: "Lina" },
    });
  });
});

describe("withBriefProposals", () => {
  it("leaves a brand with nothing pending untouched", () => {
    const ws = workspace([brief()]);
    expect(withBriefProposals(ws)).toBe(ws);
  });

  it("turns a brief sent from elsewhere into proposals, once", () => {
    const once = withBriefProposals(workspace([brief({ proposalsPending: true })]));
    expect(once.drafts.map((d) => d.content)).toEqual(["To help"]);
    expect(once.briefs[0].proposalsPending).toBe(false);
    expect(withBriefProposals(once)).toBe(once);
  });
});
