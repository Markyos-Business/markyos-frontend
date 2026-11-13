import { afterEach, describe, expect, it, vi } from "vitest";
import { readGuestLang, subscribeGuestLang, writeGuestLang } from "./interfaceLang";

const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); vi.unstubAllGlobals(); });

function browser(href: string, blockedStorage = false) {
  let location = new URL(href);
  const values = new Map<string, string>();
  const state = { router: "preserve-me" };
  const history = { state, replaceState: vi.fn((_state: unknown, _title: string, next: string) => { location = new URL(next, location); }) };
  vi.stubGlobal("window", {
    get location() { return location; },
    history,
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { if (blockedStorage) throw new Error("Storage blocked"); values.set(key, value); },
    },
  });
  return { history, state, values, location: () => location };
}

describe("explicit interface language choices", () => {
  it("replaces a URL language without losing the return path or hash", () => {
    const page = browser("https://app.markyos.test/login?lang=en&next=%2Fw%2Fbrand%2Fstrategy#recover");
    const changed = vi.fn();
    cleanups.push(subscribeGuestLang(changed));
    writeGuestLang("ar");
    expect(readGuestLang()).toBe("ar");
    expect(page.location().searchParams.get("lang")).toBe("ar");
    expect(page.location().searchParams.get("next")).toBe("/w/brand/strategy");
    expect(page.location().hash).toBe("#recover");
    expect(page.values.get("markyos.lang")).toBe("ar");
    expect(page.history.replaceState).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledOnce();
  });

  it("records a switch on a URL that had no language selector", () => {
    const page = browser("https://app.markyos.test/login?next=%2Fbrands");
    writeGuestLang("en");
    expect(page.location().pathname).toBe("/login");
    expect(page.location().searchParams.get("next")).toBe("/brands");
    expect(readGuestLang()).toBe("en");
  });

  it("keeps the explicit choice usable when storage is blocked", () => {
    const page = browser("https://app.markyos.test/login?lang=en", true);
    expect(() => writeGuestLang("ar")).not.toThrow();
    expect(page.location().searchParams.get("lang")).toBe("ar");
    expect(readGuestLang()).toBe("ar");
  });
});
