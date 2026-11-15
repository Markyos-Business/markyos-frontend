import { describe, expect, it } from "vitest";
import type { LogoSlot, SlotKind, Workspace } from "@/types";
import { lockupSlot } from "./brand-logo";

const slot = (kind: SlotKind, attached: boolean): LogoSlot =>
  ({ kind, phase: attached ? "attached" : "empty", url: attached ? `/${kind}.svg` : undefined, clearspaceMultiplier: 0.5 }) as LogoSlot;
const brand = (arabic: boolean, latin: boolean, symbol = false) =>
  ({ logo: { arabic: slot("arabic", arabic), latin: slot("latin", latin), symbol: slot("symbol", symbol) } }) as unknown as Workspace;

describe("lockupSlot", () => {
  it("shows the lockup in the language being read", () => {
    expect(lockupSlot(brand(true, true), false)?.kind).toBe("latin");
    expect(lockupSlot(brand(true, true), true)?.kind).toBe("arabic");
  });

  it("falls back to the other script, then the symbol", () => {
    expect(lockupSlot(brand(true, false), false)?.kind).toBe("arabic");
    expect(lockupSlot(brand(false, true), true)?.kind).toBe("latin");
    expect(lockupSlot(brand(false, false, true), false)?.kind).toBe("symbol");
    expect(lockupSlot(brand(false, false), true)).toBeUndefined();
  });
});
