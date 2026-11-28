import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildInitialWorkspaces } from "@/lib/data/mockData";
import type { Workspace } from "@/types";
import { StrategyDocument } from "./strategy-document";

const brand = (strategy: Partial<Workspace["strategy"]>): Workspace => {
  const ws = buildInitialWorkspaces()[0];
  return { ...ws, strategy: { ...ws.strategy, ...strategy } };
};

describe("StrategyDocument language fallback", () => {
  it("says so when an Arabic reader is shown English", () => {
    const html = renderToStaticMarkup(<StrategyDocument ws={brand({ purpose: "<p>Coffee from Wadi Rum</p>", purposeAr: "" })} isAr lang="ar" />);
    expect(html).toContain("لم يُكتب بالعربية بعد");
  });

  it("stays quiet when everything shown is in the reader's language", () => {
    const html = renderToStaticMarkup(
      <StrategyDocument
        ws={brand({
          purpose: "<p>Coffee from Wadi Rum</p>",
          purposeAr: "<p>قهوة من وادي رم</p>",
          vision: "",
          visionAr: "",
          mission: "",
          missionAr: "",
          coreValues: [],
          personas: [],
          competitors: [],
          competitorColumns: [],
          voiceTraits: [],
          objectives: [],
          positioningOptions: [],
          targetAudienceSummary: "",
          targetAudienceSummaryAr: "",
          positioningStatement: "",
          positioningStatementAr: "",
          uvp: "",
          uvpAr: "",
        })}
        isAr
        lang="ar"
      />,
    );
    expect(html).not.toContain("لم يُكتب بالعربية بعد");
    expect(html).toContain("قهوة من وادي رم");
  });
});
