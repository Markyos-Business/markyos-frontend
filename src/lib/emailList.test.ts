import { describe, expect, it } from "vitest";
import { parseEmails } from "./emailList";

describe("parseEmails", () => {
  it("splits on commas, spaces and lines, once each", () =>
    expect(parseEmails("Omar@Wadirum.coffee, layla@najd.sa\nomar@wadirum.coffee").emails).toEqual([
      "omar@wadirum.coffee",
      "layla@najd.sa",
    ]));
  it("returns what isn't an email", () => expect(parseEmails("nour@, khalid@harbi.design").invalid).toEqual(["nour@"]));
  it("is empty for blank text", () => expect(parseEmails("  ")).toEqual({ emails: [], invalid: [] }));
});
