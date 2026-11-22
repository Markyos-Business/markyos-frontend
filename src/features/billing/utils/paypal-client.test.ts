import { describe, expect, it } from "vitest";
import type { Plans } from "../types";
import { paypalClient } from "./paypal-client";

const plans = (paypal?: Plans["paypal"]): Plans => ({
  currency: "usd",
  interval: "month",
  perBrand: true,
  free: { brands: 1, editors: 0 },
  freeRulesApply: true,
  types: {
    studio: { monthly: 2900, limits: { brands: null, editors: null } },
    freelancer: { monthly: 1900, limits: { brands: 3, editors: 0 } },
    company: { monthly: 4900, limits: { brands: 1, editors: null } },
  },
  ...(paypal ? { paypal } : {}),
});

describe("paypalClient", () => {
  it("waits for the plans", () => {
    expect(paypalClient(null, "ENV")).toEqual({ state: "waiting" });
  });

  it("uses the server's id", () => {
    expect(paypalClient(plans({ clientId: "SRV", env: "sandbox" }), undefined)).toEqual({ state: "ready", clientId: "SRV" });
    expect(paypalClient(plans({ clientId: "SRV", env: "live" }), "SRV")).toEqual({ state: "ready", clientId: "SRV" });
  });

  it("falls back to the build's id only when the server sends none", () => {
    expect(paypalClient(plans({ clientId: null, env: "sandbox" }), "ENV")).toEqual({ state: "ready", clientId: "ENV" });
    // An older server without the field.
    expect(paypalClient(plans(), "ENV")).toEqual({ state: "ready", clientId: "ENV" });
  });

  it("is unavailable with no id anywhere", () => {
    expect(paypalClient(plans({ clientId: null, env: "sandbox" }), "")).toEqual({ state: "unavailable", mismatch: false });
    expect(paypalClient(plans({ clientId: "  ", env: "sandbox" }), undefined)).toEqual({ state: "unavailable", mismatch: false });
  });

  it("refuses two different ids: a misconfiguration", () => {
    expect(paypalClient(plans({ clientId: "SRV", env: "live" }), "ENV")).toEqual({ state: "unavailable", mismatch: true });
  });
});
