import { describe, expect, it } from "vitest";
import { replyHref } from "./message-mail";

describe("replyHref", () => {
  it("answers in English with the topic as the subject", () => {
    expect(replyHref({ email: "omar.aziz@example.com", topic: "sales", replyLanguage: "en", locale: "ar" })).toBe(
      "mailto:omar.aziz@example.com?subject=Re%3A%20Sales%20and%20Enterprise",
    );
  });

  it("answers in Arabic when that is the reply language", () => {
    const href = replyHref({ email: "nour@example.com", topic: "support", replyLanguage: "ar", locale: "en" });
    expect(decodeURIComponent(href.split("subject=")[1])).toBe("رد: الدعم");
  });

  it("falls back to the website language, and keeps the address safe", () => {
    const href = replyHref({ email: "a+b?c@example.com", topic: "other", replyLanguage: "", locale: "ar" });
    expect(href.startsWith("mailto:a%2Bb%3Fc@example.com?subject=")).toBe(true);
    expect(decodeURIComponent(href.split("subject=")[1])).toBe("رد: شيء آخر");
  });
});
