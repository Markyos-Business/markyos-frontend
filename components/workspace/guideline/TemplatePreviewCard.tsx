"use client";

import { GuidelineTemplate, StudioStyle, Workspace } from "@/lib/types";
import { getBrandThemeFor } from "@/lib/theme";

/**
 * A small live mockup of what each guideline-site template looks like, in this
 * brand's own colours.
 *
 * Each card renders the theme *that template* would produce, not the one
 * currently selected — the templates no longer share a palette, so previewing
 * them all in the active template's colours would show six identical cards and
 * then deliver something else. The corner radii in the preview come from the
 * same design system too, which is usually the difference you notice first.
 */
export function TemplatePreviewCard({
  kind,
  name,
  description,
  active,
  ws,
  onSelect,
}: {
  kind: GuidelineTemplate;
  name: string;
  description: string;
  active: boolean;
  ws: Workspace;
  onSelect: () => void;
}) {
  const theme = getBrandThemeFor(ws, kind);
  // The preview's own bars take the template's corner language, so a sharp
  // system reads as sharp in the picker instead of only after you pick it.
  const r = Math.min(theme.ds.radius.pill, 4);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="mk-card rounded-2xl p-3 flex flex-col gap-2.5 text-start cursor-pointer w-full"
      style={{ background: "var(--surface-2)", boxShadow: active ? "inset 0 0 0 2px var(--accent)" : "inset 0 0 0 1px var(--hairline)" }}
    >
      <div className="rounded-lg overflow-hidden h-[76px] flex" style={{ background: theme.canvas }}>
        {kind === "vault" && (
          <>
            <div className="w-[22%] h-full" style={{ background: theme.surface1 }} />
            <div className="flex-1 flex flex-col gap-1.5 p-2.5">
              <div className="h-1.5 w-[60%] rounded-full" style={{ background: theme.accent }} />
              <div className="h-1 w-[80%] rounded-full" style={{ background: theme.surface2 }} />
              <div className="h-1 w-[70%] rounded-full" style={{ background: theme.surface2 }} />
            </div>
          </>
        )}
        {kind === "docs" && (
          <>
            <div className="w-[32%] h-full flex flex-col gap-1 p-2" style={{ background: theme.surface1 }}>
              <div className="h-1 w-[80%] rounded-full" style={{ background: theme.surface2 }} />
              <div className="h-1 w-[60%] rounded-full" style={{ background: theme.surface2 }} />
              <div className="h-1 w-[70%] rounded-full" style={{ background: theme.surface2 }} />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="h-[35%] w-full" style={{ background: theme.accent }} />
              <div className="flex-1 p-2 flex flex-col gap-1">
                <div className="h-1 w-[80%] rounded-full" style={{ background: theme.surface2 }} />
                <div className="h-1 w-[60%] rounded-full" style={{ background: theme.surface2 }} />
              </div>
            </div>
          </>
        )}
        {kind === "studio" && (
          <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5">
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 100%, ${theme.accent} 0%, transparent 65%)` }} />
            <div className="h-2 w-[24%] rounded-full relative" style={{ background: theme.accentInk }} />
            <div className="h-1.5 w-[46%] rounded-full relative" style={{ background: theme.text }} />
          </div>
        )}
        {kind === "manual" && (
          // A page of the book: the inverted opener band on the binding side,
          // then the rail with its running head and title, then the content.
          <>
            <div className="w-[26%] h-full flex flex-col justify-end p-2" style={{ background: theme.invertBg }}>
              <div className="h-1.5 w-[70%]" style={{ background: theme.accent }} />
              <div className="h-1 w-[50%] mt-1" style={{ background: theme.accent, opacity: 0.6 }} />
            </div>
            <div className="flex-1 flex gap-2 p-2.5" style={{ boxShadow: `inset 1px 0 0 ${theme.hairline}` }}>
              <div className="w-[38%] flex flex-col gap-1">
                <div className="h-0.5 w-full" style={{ background: theme.surface2 }} />
                <div className="h-1.5 w-[80%] mt-1.5" style={{ background: theme.text, opacity: 0.85 }} />
                <div className="h-1 w-[60%]" style={{ background: theme.surface2 }} />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-1 w-full" style={{ background: theme.surface2 }} />
                <div className="h-1 w-[85%]" style={{ background: theme.surface2 }} />
                <div className="h-1 w-[70%]" style={{ background: theme.surface2 }} />
              </div>
            </div>
          </>
        )}
        {kind === "mosaic" && (
          // The bento: a big accent tile, a palette stack beside it, and a row
          // of smaller tiles underneath.
          <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-1 p-1.5">
            <div className="col-span-2 row-span-2 flex items-end p-1.5" style={{ borderRadius: r, background: theme.accent }}>
              <div className="h-1.5 w-[60%] rounded-full" style={{ background: theme.accentInk, opacity: 0.9 }} />
            </div>
            <div className="row-span-2 flex flex-col overflow-hidden" style={{ borderRadius: r, background: theme.surface1 }}>
              <div className="flex-1" style={{ background: theme.accent }} />
              <div className="flex-1" style={{ background: theme.surface2 }} />
              <div className="flex-1" style={{ background: theme.text, opacity: 0.8 }} />
            </div>
            <div style={{ borderRadius: r, background: theme.surface1 }} />
            <div style={{ borderRadius: r, background: theme.surface1 }} />
            <div style={{ borderRadius: r, background: theme.accentSoft }} />
          </div>
        )}
        {kind === "deck" && (
          // Two stacked 16:9 frames — a filled cover and a rail+panel slide.
          <div className="flex-1 flex flex-col gap-1 p-1.5">
            <div className="h-1/2 flex items-end p-1" style={{ borderRadius: r, background: theme.accent }}>
              <div className="h-1 w-[45%] rounded-full" style={{ background: theme.accentInk, opacity: 0.9 }} />
            </div>
            <div className="h-1/2 flex gap-1 p-1" style={{ borderRadius: r, background: theme.surface1 }}>
              <div className="w-[22%] flex flex-col gap-0.5">
                <div className="h-0.5 w-full rounded-full" style={{ background: theme.accent }} />
                <div className="h-0.5 w-[70%] rounded-full" style={{ background: theme.surface2 }} />
              </div>
              <div className="flex-1" style={{ borderRadius: r, background: theme.accentSoft }} />
            </div>
          </div>
        )}
      </div>
      <div>
        <div className="text-[12.5px] font-semibold">{name}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{description}</div>
      </div>
    </button>
  );
}

/** Same idea as TemplatePreviewCard, one level down — a small live mockup
 *  for each of the 3 Studio sub-styles. */
export function StudioStylePreviewCard({
  style,
  name,
  description,
  active,
  ws,
  onSelect,
}: {
  style: StudioStyle;
  name: string;
  description: string;
  active: boolean;
  ws: Workspace;
  onSelect: () => void;
}) {
  const theme = getBrandThemeFor(ws, "studio", style);
  const r = Math.min(theme.ds.radius.pill, 4);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="mk-card rounded-2xl p-3 flex flex-col gap-2.5 text-start cursor-pointer w-full"
      style={{ background: "var(--surface-2)", boxShadow: active ? "inset 0 0 0 2px var(--accent)" : "inset 0 0 0 1px var(--hairline)" }}
    >
      <div className="rounded-lg overflow-hidden h-[64px] flex" style={{ background: theme.canvas }}>
        {style === "signal" && (
          <div className="flex-1 flex flex-col">
            <div className="h-[22%] w-full flex items-center justify-end px-2" style={{ background: theme.surface1 }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: theme.text }} />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1">
              <div className="h-1.5 w-[30%]" style={{ borderRadius: r, background: theme.accent }} />
              <div className="h-1 w-[46%]" style={{ borderRadius: r, background: theme.text }} />
            </div>
          </div>
        )}
        {style === "atlas" && (
          <>
            <div className="w-[34%] h-full flex flex-col gap-1 p-2" style={{ background: theme.surface1 }}>
              <div className="h-1 w-[80%] rounded-full" style={{ background: theme.surface2 }} />
              <div className="h-1 w-[60%] rounded-full" style={{ background: theme.accent }} />
              <div className="h-1 w-[70%] rounded-full" style={{ background: theme.surface2 }} />
            </div>
            <div className="flex-1 relative overflow-hidden" style={{ background: theme.accent }}>
              {/* Decoration, and marked as such. This whole card is an
                  abstract miniature of a layout — bars standing in for text,
                  a numeral standing in for a page number. It is named by the
                  template's own title beside it, so announcing a stray "02"
                  from inside the thumbnail is noise. */}
              <span aria-hidden="true" className="absolute -top-2 end-1 font-semibold" style={{ fontSize: 36, color: theme.canvas, opacity: 0.3 }}>02</span>
            </div>
          </>
        )}
        {style === "prism" && (
          <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5">
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 100%, ${theme.accent} 0%, transparent 65%)` }} />
            <div className="h-1.5 w-[20%] rounded-full relative" style={{ background: theme.accentInk }} />
            <div className="h-1.5 w-[40%] rounded-full relative" style={{ background: theme.text }} />
          </div>
        )}
      </div>
      <div>
        <div className="text-[12px] font-semibold">{name}</div>
        <div className="text-[10.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>{description}</div>
      </div>
    </button>
  );
}
