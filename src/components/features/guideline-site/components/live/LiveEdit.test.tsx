import React, { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UiStringsProvider } from "@/components/ui/i18n/uiStrings";
import { EditableText, LiveEditProvider, SectionHeading, SectionNote, useLiveEdit } from "./LiveEdit";

function Editing({ children }: { children: ReactNode }) {
  return <LiveEditProvider value={useLiveEdit()}>{children}</LiveEditProvider>;
}
const render = (child: ReactNode, lang: "en" | "ar" = "en") => renderToStaticMarkup(
  <UiStringsProvider lang={lang}><Editing>{child}</Editing></UiStringsProvider>,
);

describe("live editing accessible fields", () => {
  it("names a filled editor by purpose rather than its value or example", () => {
    const html = render(createElement(EditableText, { label: "Metric value", value: "42", placeholder: "100%", onCommit: () => {} }));
    expect(html).toContain('aria-label="Metric value"');
    expect(html).toContain('role="textbox"');
    expect(html).toContain('aria-multiline="false"');
  });
  it("exposes multiline editing explicitly", () => {
    expect(render(createElement(EditableText, { label: "Quote", value: "", placeholder: "Write", multiline: true, onCommit: () => {} }))).toContain('aria-multiline="true"');
  });
  for (const [lang, title, guidance] of [["en", "Section title", "Section guidance"], ["ar", "عنوان القسم", "إرشادات القسم"]] as const) {
    it(`names section fields in ${lang}`, () => {
      expect(render(createElement(SectionHeading, { sectionId: "logo", value: "Acme" }), lang)).toContain(`aria-label="${title}: Acme"`);
      expect(render(createElement(SectionNote, { sectionId: "logo" }), lang)).toContain(`aria-label="${guidance}"`);
    });
  }
  it("keeps the published view ordinary text without editing semantics", () => {
    const html = renderToStaticMarkup(createElement(EditableText, { label: "Heading", value: "Acme", placeholder: "Write", onCommit: () => {} }));
    expect(html).toContain("Acme");
    expect(html).not.toContain('role="textbox"');
    expect(html).not.toContain("aria-label");
  });
});
