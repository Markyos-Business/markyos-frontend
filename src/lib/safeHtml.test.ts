import { describe, expect, it } from "vitest";
import { sanitizeRichHtml } from "./safeHtml";

describe("rich HTML", () => {
  it("removes executable elements, handlers, and encoded script URLs", () => {
    const result = sanitizeRichHtml('<p onclick="alert(1)">Copy<img src=x onerror="alert(1)"><script>alert(1)</script><a href="jav&#x61;script:alert(1)">link</a><svg onload="alert(1)"></svg></p>');
    expect(result).toBe("<p>Copy<a>link</a></p>");
  });
  it("preserves supported formatting and safe links", () => {
    const html = '<h2 dir="rtl">Title</h2><p><strong>Copy</strong> <a href="https://example.com">link</a></p><table><tr><td colspan="2">Cell</td></tr></table>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });
});
