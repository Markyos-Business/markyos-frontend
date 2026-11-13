import { describe, expect, it } from "vitest";
import { channels, cmykToRgb, formatColor, fromChannels, hslToRgb, hsvToRgb, normalizeHex, rgbToHex, rgbToHsv } from "./color";

describe("color", () => {
  it("normalises hex, short and long, with or without #", () => {
    expect(normalizeHex("#09f")).toBe("#0099FF");
    expect(normalizeHex(" 0099ff ")).toBe("#0099FF");
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("blue")).toBeNull();
  });

  it("round-trips through HSV", () => {
    for (const hex of ["#0099FF", "#FF0066", "#000000", "#FFFFFF", "#7F7F7F", "#00DE68"]) {
      const rgb = { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
      expect(rgbToHex(hsvToRgb(rgbToHsv(rgb)))).toBe(hex);
    }
  });

  it("converts HSL and CMYK back to RGB", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb({ h: 120, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
    expect(cmykToRgb({ c: 0, m: 0, y: 0, k: 100 })).toEqual({ r: 0, g: 0, b: 0 });
    expect(cmykToRgb({ c: 100, m: 40, y: 0, k: 0 })).toEqual({ r: 0, g: 153, b: 255 });
  });

  it("reads and writes each notation's channels", () => {
    expect(channels("#0099FF", "rgb")).toEqual([0, 153, 255]);
    expect(fromChannels("rgb", [0, 153, 255])).toBe("#0099FF");
    expect(fromChannels("rgb", [999, -4, NaN])).toBe("#FF0000");
    expect(fromChannels("cmyk", channels("#0099FF", "cmyk"))).toBe("#0099FF");
  });

  it("formats for pasting", () => {
    expect(formatColor("#0099ff", "hex")).toBe("#0099FF");
    expect(formatColor("#0099FF", "rgb")).toBe("rgb(0, 153, 255)");
    expect(formatColor("#FF0000", "hsl")).toBe("hsl(0, 100%, 50%)");
    expect(formatColor("#0099FF", "cmyk")).toBe("cmyk(100%, 40%, 0%, 0%)");
  });
});
