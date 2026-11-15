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

describe("sanitizeRichHtml media", () => {
  const figure = '<figure><img src="https://cdn.markyos.com/a.png" alt="Logo"><figcaption>Logo</figcaption></figure>';

  it("drops images from brand copy", () => {
    expect(sanitizeRichHtml(figure)).not.toContain("<img");
  });

  it("keeps images, figures and captions in articles", () => {
    const clean = sanitizeRichHtml(figure, { media: true });
    expect(clean).toContain('<img src="https://cdn.markyos.com/a.png" alt="Logo" />');
    expect(clean).toContain("<figcaption>Logo</figcaption>");
  });

  it("never lets a data: or script source through", () => {
    for (const src of ["data:image/png;base64,AAAA", "javascript:alert(1)", "//evil.test/x.png"]) {
      expect(sanitizeRichHtml(`<img src="${src}" onerror="x()">`, { media: true })).not.toMatch(/src=|onerror/);
    }
  });
});
