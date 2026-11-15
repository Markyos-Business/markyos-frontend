import { describe, expect, it } from "vitest";
import { accepts, fileSize, sortFiles } from "./file-rules";

const file = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });

describe("file rules", () => {
  it("matches extensions, exact types and type groups", () => {
    expect(accepts(file("brief.PDF", "application/pdf", 1), ".pdf")).toBe(true);
    expect(accepts(file("logo.png", "image/png", 1), "image/*")).toBe(true);
    expect(accepts(file("logo.png", "image/png", 1), "image/svg+xml,.pdf")).toBe(false);
  });

  it("writes sizes with Western digits", () => {
    expect(fileSize(900)).toBe("900 B");
    expect(fileSize(860_000)).toBe("840 KB");
    expect(fileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });

  it("says why each refused file was refused", () => {
    const { accepted, rejected } = sortFiles(
      [file("a.png", "image/png", 10), file("b.exe", "application/x-msdownload", 10), file("c.png", "image/png", 5000), file("d.png", "image/png", 10)],
      { accept: "image/*", maxBytes: 1000, maxFiles: 2, already: 1 },
    );
    expect(accepted.map((f) => f.name)).toEqual(["a.png"]);
    expect(rejected.map((r) => `${r.file.name}:${r.reason}`)).toEqual(["b.exe:type", "c.png:size", "d.png:count"]);
  });
});
