import { describe, expect, it } from "vitest";
import { richToPlainText } from "./rich-text";

describe("richToPlainText", () => {
  it("leaves plain text alone", () => {
    expect(richToPlainText("Built for Riyadh")).toBe("Built for Riyadh");
  });

  it("drops the markup a pasted heading brings with it", () => {
    const pasted = '<h3><span style="font-size: 14px; font-weight: 400;">This is test&nbsp;</span></h3><div><span>More</span></div>';
    expect(richToPlainText(pasted)).toBe("This is test More");
  });

  it("decodes entities, named and numeric", () => {
    expect(richToPlainText("<p>Nour &amp; Omar &lt;3 &#1593;&#x0644;</p>")).toBe("Nour & Omar <3 عل");
  });

  it("is empty for markup with no words", () => {
    expect(richToPlainText("<p><br></p>")).toBe("");
  });
});
