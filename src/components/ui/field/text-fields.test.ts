import { describe, expect, it } from "vitest";
import { scorePassword } from "@/lib/passwordStrength";
import { normalizeHex, parseColorText } from "./hex-color-input";
import { groupTyped, parseNumber, westernDigits } from "./number-field";
import { toSlug } from "./slug-field";
import { isWebAddress } from "./url-field";

describe("number entry", () => {
  it("reads Arabic-Indic digits and the Arabic decimal separator", () => {
    expect(westernDigits("٨٤٬٥٠٠٫٥")).toBe("84,500.5");
    expect(parseNumber("٨٤٬٥٠٠")).toBe(84500);
  });

  it("is empty for nothing, a lone sign or a lone point", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber(".")).toBeNull();
  });

  it("groups thousands as you type and keeps a decimal in progress", () => {
    expect(groupTyped("84500", 2)).toBe("84,500");
    expect(groupTyped("84500.", 2)).toBe("84,500.");
    expect(groupTyped("84500.567", 2)).toBe("84,500.56");
    expect(groupTyped("0084500", 0)).toBe("84,500");
  });
});

describe("slugs", () => {
  it("makes a slug from a name, dropping accents", () => {
    expect(toSlug("  Nour Haddad Café ")).toBe("nour-haddad-cafe");
  });

  it("keeps a trailing dash while typing so the next word can follow", () => {
    expect(toSlug("riyadh-", true)).toBe("riyadh-");
    expect(toSlug("riyadh-")).toBe("riyadh");
  });

  it("has no Latin slug for Arabic text", () => {
    expect(toSlug("الرياض")).toBe("");
  });
});

describe("hex colours", () => {
  it("accepts six or three digits, with or without #", () => {
    expect(normalizeHex("0099ff")).toBe("#0099FF");
    expect(normalizeHex("#09f")).toBe("#0099FF");
  });

  it("refuses anything else", () => {
    expect(normalizeHex("#0099f")).toBeNull();
    expect(normalizeHex("blue")).toBeNull();
  });
});

describe("web addresses", () => {
  it("needs a protocol and a dotted host", () => {
    expect(isWebAddress("https://markyos.com/riyadh")).toBe(true);
    expect(isWebAddress("https://markyos")).toBe(false);
    expect(isWebAddress("markyos.com")).toBe(false);
  });
});

describe("password strength", () => {
  it("rewards length over symbols", () => {
    expect(scorePassword("Pa1!").score).toBeLessThan(scorePassword("riyadh dubai cairo nour").score);
  });

  it("calls out a common password", () => {
    expect(scorePassword("password123").label).toBe("tooCommon");
  });
});

describe("pasted colours", () => {
  it("turns rgb() and a bare hex into #RRGGBB", () => {
    expect(parseColorText("rgb(11, 93, 109)")).toBe("#0B5D6D");
    expect(parseColorText("rgba(11 93 109 / 50%)")).toBe("#0B5D6D");
    expect(parseColorText("0b5d6d")).toBe("#0B5D6D");
  });

  it("refuses out-of-range channels and words", () => {
    expect(parseColorText("rgb(300, 0, 0)")).toBeNull();
    expect(parseColorText("teal")).toBeNull();
  });
});
