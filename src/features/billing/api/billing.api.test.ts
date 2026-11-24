import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.fn();
vi.mock("@/lib/api/client", async (actual) => ({ ...(await actual<typeof import("@/lib/api/client")>()), api: (...args: unknown[]) => api(...args) }));

const { checkCode, startSubscription } = await import("./billing.api");

beforeEach(() => api.mockReset());

describe("startSubscription", () => {
  it("without a code, creates the subscription on the plan the server names", async () => {
    api.mockResolvedValue({ planId: "P-STUDIO", customId: "co-1" });
    const create = vi.fn().mockResolvedValue("I-NEW");
    await expect(startSubscription("b-1", null, create)).resolves.toBe("I-NEW");
    expect(api).toHaveBeenCalledWith("/billing/paypal/start/", { method: "POST", body: { brandId: "b-1" } });
    expect(create).toHaveBeenCalledWith({ plan_id: "P-STUDIO", custom_id: "co-1" });
  });

  it("with a code, approves the subscription the server made and creates none", async () => {
    api.mockResolvedValue({ subscriptionId: "I-CODE", customId: "co-2" });
    const create = vi.fn();
    await expect(startSubscription("b-1", "MRK-7KQ4-XP2M", create)).resolves.toBe("I-CODE");
    expect(api).toHaveBeenCalledWith("/billing/paypal/start/", { method: "POST", body: { brandId: "b-1", code: "MRK-7KQ4-XP2M" } });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("checkCode", () => {
  it("sends the brand and the code", async () => {
    api.mockResolvedValue({ code: "MRK-7KQ4-XP2M" });
    await checkCode("b-1", "MRK-7KQ4-XP2M");
    expect(api).toHaveBeenCalledWith("/billing/codes/check/", { method: "POST", body: { brandId: "b-1", code: "MRK-7KQ4-XP2M" } });
  });
});
