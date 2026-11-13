import { describe, expect, it } from "vitest";
import { scorePassword } from "@/lib/passwordStrength";
import { normalizeHex } from "./HexColorField";
import { groupTyped, parseNumber, westernDigits } from "./NumberField";
import { toSlug } from "./SlugField";
import { isWebAddress } from "./UrlField";

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
