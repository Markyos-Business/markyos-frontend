import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./interfaceTheme";

describe("pre-paint theme script", () => {
  it.each([
    ["light", false, "light"],
    ["dark", true, "dark"],
    ["system", true, "light"],
    ["system", false, "dark"],
    [null, true, "light"],
  ])("resolves %s with prefers-light=%s before hydration", (choice, prefersLight, theme) => {
    const setAttribute = vi.fn();
    const getItem = vi.fn(() => choice);
    runInNewContext(THEME_INIT_SCRIPT, {
      localStorage: { getItem },
      window: { matchMedia: () => ({ matches: prefersLight }) },
      document: { documentElement: { setAttribute } },
    });
    expect(getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    expect(setAttribute).toHaveBeenCalledWith("data-theme", theme);
  });

  it("uses the safe dark default when storage is blocked", () => {
    const setAttribute = vi.fn();
    runInNewContext(THEME_INIT_SCRIPT, {
      localStorage: { getItem: () => { throw new Error("Storage blocked"); } },
      document: { documentElement: { setAttribute } },
    });
    expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
  });
});
