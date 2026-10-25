import { describe, expect, it } from "vitest";
import { citationHref } from "./citations";

describe("citationHref", () => {
  it("opens a form answer by question", () => {
    expect(
      citationHref("acme", { id: "F1.Q3", label: "Form · Q3", ref: { type: "form", formId: "f1", formName: "Rebrand", questionId: "q9", number: 3 } })
    ).toBe("/w/acme/forms/f1/answers?q=q9");
  });

  it("opens a call at the turn or the line", () => {
    const call = { type: "call" as const, noteId: "n1", title: "Kick-off" };
    expect(citationHref("acme", { id: "C1.T4", label: "Call", ref: { ...call, turn: 4 } })).toBe("/w/acme/discovery/calls/n1?turn=4");
    expect(citationHref("acme", { id: "C1.P0", label: "Call", ref: { ...call, para: 0 } })).toBe("/w/acme/discovery/calls/n1?para=0");
  });
});
