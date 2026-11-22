import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { errorText, fieldErrors } from "./errorText";

describe("errorText", () => {
  it("names the kind of failure in the reader's language", () => {
    expect(errorText(new ApiError("Can't reach", 0), "ar")).toContain("تعذّر الاتصال");
    expect(errorText(new ApiError("Forbidden", 403), "en")).toBe("You don't have access to do this.");
    expect(errorText(new ApiError("Not found.", 404), "ar")).toContain("لم يعد");
    expect(errorText(new ApiError("boom", 502), "en")).toContain("on our side");
    expect(errorText(new ApiError("stale", 409), "en")).toContain("Reload");
  });
  it("localizes rate limits with the right plural", () => {
    expect(errorText(new ApiError("x", 429, {}, null, null, 1), "en")).toBe("Too many attempts. Try again in 1 second.");
    expect(errorText(new ApiError("x", 429, {}, null, null, 2), "ar")).toBe("محاولات كثيرة. حاول مرة أخرى بعد ثانيتين.");
    expect(errorText(new ApiError("x", 429, {}, null, null, 300), "en")).toBe("Too many attempts. Try again in 5 minutes.");
    expect(errorText(new ApiError("x", 429), "en")).toBe("Too many attempts. Try again shortly.");
  });
  it("shows a validation message only in the language it was written in", () => {
    const err = new ApiError("A brand with this name already exists.", 400, { name: "A brand with this name already exists." });
    expect(errorText(err, "en")).toBe("A brand with this name already exists.");
    expect(errorText(err, "ar")).toBe("تعذّر الحفظ. راجع ما أدخلته وحاول مرة أخرى.");
    expect(errorText(err, "ar", { en: "Couldn't save.", ar: "تعذّر حفظ العلامة." })).toBe("تعذّر حفظ العلامة.");
    expect(fieldErrors(err, "en")).toEqual({ name: "A brand with this name already exists." });
    expect(fieldErrors(err, "ar")).toEqual({});
  });
  it("never shows a raw JavaScript error in the wrong language", () => {
    expect(errorText(new TypeError("Failed to fetch"), "ar")).toBe("حدث خطأ. حاول مرة أخرى.");
    expect(errorText(new Error("تعذّر قراءة الملف."), "ar")).toBe("تعذّر قراءة الملف.");
    expect(errorText("nope", "en")).toBe("Something went wrong. Try again.");
  });
});
