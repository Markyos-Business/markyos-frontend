import { describe, expect, it } from "vitest";
import { EMAIL_RE } from "./emailList";

describe("EMAIL_RE", () => {
  it("accepts an address", () => expect(EMAIL_RE.test("layla@najd.sa")).toBe(true));
  it("rejects a half address", () => expect(EMAIL_RE.test("nour@")).toBe(false));
  it("rejects spaces", () => expect(EMAIL_RE.test("a b@c.de")).toBe(false));
});
