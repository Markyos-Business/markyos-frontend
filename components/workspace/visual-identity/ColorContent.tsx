"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { ColorEditorModal } from "@/components/workspace/color/ColorEditorModal";
import { ExtractFromLogoModal } from "@/components/workspace/color/ExtractFromLogoModal";
import { ContrastReport } from "@/components/workspace/ContrastReport";
import { ColorSwatch, SlotKind, Workspace } from "@/lib/types";
import { contrastRatio, hexToRgb, rgbToCmyk } from "@/lib/utils";

type EditorState = { mode: "add" } | { mode: "edit"; color: ColorSwatch };

export function ColorContent({ ws }: { ws: Workspace }) {
  const { addColor, updateColor, removeColor, setPrimaryColor, uiLang } = useApp();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const isAr = uiLang(ws) === "ar";
  /** Something to read a palette out of — a logo slot, or any uploaded image. */
  const hasArtwork =
    (Object.keys(ws.logo) as SlotKind[]).some((k) => ws.logo[k].phase === "attached" && ws.logo[k].url) ||
    ws.assets.some((a) => ["photo", "mockup", "export", "graphic", "illustration", "pattern"].includes(a.type));

  const canvasSwatch = ws.colors.find((c) => c.id === "canvas") ?? { hex: "#090909" };
  const accentSwatch = ws.colors.find((c) => c.isPrimary) ?? ws.colors[0];
  const ratio = accentSwatch ? contrastRatio(accentSwatch.hex, canvasSwatch.hex) : null;
  const passesLarge = ratio !== null && ratio >= 3;
  const passesSmall = ratio !== null && ratio >= 4.5;

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied — ${value}`, "success");
    } catch {
      showToast("Couldn't copy — copy it manually.", "danger");
    }
  }

  return (
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto">
      {/* Wraps on a narrow window — see the note in BrandFilesContent. */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-[16rem] flex-1">
          <h1
            className="text-[30px] font-semibold tracking-tight mb-1.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isAr ? "الألوان" : "Color"}
          </h1>
          <p dir="auto" className="bidi-auto text-[14px]" style={{ color: "var(--text-muted)" }}>
            {isAr
              ? `${ws.colors.length} لون · اضغط على أي رمز لنسخه، أو على القلم لتعديله.`
              : `${ws.colors.length} colors · click a code to copy it, or the pencil to edit.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExtracting(true)}
            title={
              hasArtwork
                ? isAr
                  ? "اقرأ الألوان الموجودة فعليًا في الشعار"
                  : "Read the colours actually present in your logo"
                : isAr
                  ? "ارفع شعارًا أولًا"
                  : "Upload a logo first"
            }
            disabled={!hasArtwork}
            className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
          >
            <Icon name="palette" size={14} style={{ color: "var(--accent-text)" }} />
            {isAr ? "من الشعار" : "Pick from logo"}
          </button>
          <button
            type="button"
            onClick={() => setEditor({ mode: "add" })}
            className="h-9 px-4 rounded-full text-[13px] font-semibold cursor-pointer"
            style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
          >
            {isAr ? "أضف لونًا" : "Add color"}
          </button>
        </div>
      </div>

      {/* Contrast sits next to the palette because that is where the fix is —
          a failing ratio is a swatch to change, not a report to file. */}
      {ws.colors.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface-1)" }}>
          <ContrastReport ws={ws} isAr={isAr} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ws.colors.map((c) => {
          const rgb = hexToRgb(c.hex);
          const cmyk = rgb ? rgbToCmyk(rgb) : null;
          return (
            <div key={c.id} className="rounded-[14px] overflow-hidden" style={{ background: "var(--surface-1)" }}>
              <div
                className="h-[104px]"
                style={{
                  background: c.hex,
                  boxShadow: c.isPrimary
                    ? "inset 0 0 0 1px var(--accent-edge)"
                    : "inset 0 0 0 1px var(--hairline-strong)",
                }}
              />
              <div className="px-4 py-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[14px] truncate">{c.name}</span>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {c.isPrimary && (
                      <span
                        className="text-[10px] font-medium px-2 py-[5px] rounded-full"
                        style={{ letterSpacing: ".08em", background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
                      >
                        PRIMARY
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditor({ mode: "edit", color: c })}
                      aria-label={`Edit ${c.name}`}
                      title={`Edit, set primary, or delete ${c.name}`}
                      className="h-7 w-7 grid place-items-center rounded-full cursor-pointer"
                      style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                    >
                      <Icon name="pen" size={13} />
                    </button>
                  </div>
                </div>
                <div
                  className="flex flex-col text-[11px]"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}
                >
                  <button
                    type="button"
                    onClick={() => copyValue("HEX", c.hex.toUpperCase())}
                    title={`Copy the HEX value for ${c.name}`}
                    className="mk-tap text-start cursor-pointer hover:text-text"
                  >
                    {c.hex.toUpperCase()}
                  </button>
                  <button
                    type="button"
                    disabled={!rgb}
                    onClick={() => rgb && copyValue("RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                    title={rgb ? `Copy the RGB value for ${c.name}` : undefined}
                    className="mk-tap text-start cursor-pointer hover:text-text disabled:cursor-default"
                  >
                    {rgb ? `${rgb.r} · ${rgb.g} · ${rgb.b}` : "—"}
                  </button>
                  <button
                    type="button"
                    disabled={!cmyk}
                    onClick={() =>
                      cmyk && copyValue("CMYK", `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`)
                    }
                    title={cmyk ? `Copy the CMYK value for ${c.name}` : undefined}
                    className="mk-tap text-start cursor-pointer hover:text-text disabled:cursor-default"
                  >
                    {cmyk ? `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}` : "—"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setEditor({ mode: "add" })}
          className="rounded-[14px] flex flex-col items-center justify-center gap-2.5 cursor-pointer"
          style={{ boxShadow: "inset 0 0 0 1px var(--hairline-strong)", color: "var(--text-muted)", minHeight: 220 }}
        >
          <Icon name="plus" size={22} />
          <span className="text-[13px] font-medium">Add color</span>
        </button>
      </div>

      {ratio !== null && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setShowReport((v) => !v)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer text-start"
            style={{ background: "var(--surface-1)" }}
          >
            <Icon name="adjust" size={18} style={{ color: "var(--accent-text)" }} />
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              {accentSwatch?.name} on Canvas — contrast ratio {ratio.toFixed(2)}:1,{" "}
              {passesSmall
                ? "passes WCAG AA for all text."
                : passesLarge
                ? "passes WCAG AA for large text (≥18px) only."
                : "fails WCAG AA."}
            </span>
            <span className="ms-auto text-[13px] font-medium" style={{ color: "var(--accent-text)" }}>
              {showReport ? "Hide" : "Full"} WCAG 2.2 matrix
            </span>
          </button>
          {showReport && ws.colors.length > 1 && (
            <div className="rounded-xl p-4 overflow-x-auto" style={{ background: "var(--surface-1)" }}>
              <table className="border-separate" style={{ borderSpacing: 4 }}>
                <thead>
                  <tr>
                    <th className="w-[92px]" />
                    {ws.colors.map((col) => (
                      <th key={col.id} className="p-0">
                        <div
                          className="w-[64px] h-[22px] rounded-md mx-auto"
                          style={{ background: col.hex, boxShadow: "inset 0 0 0 1px var(--chip-edge)" }}
                          title={col.name}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ws.colors.map((row) => (
                    <tr key={row.id}>
                      <td
                        className="text-[11px] pe-2 text-end whitespace-nowrap"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {row.name}
                      </td>
                      {ws.colors.map((col) => {
                        if (row.id === col.id) {
                          return (
                            <td key={col.id} className="text-center">
                              <div
                                className="w-[64px] h-[34px] rounded-md grid place-items-center text-[10px]"
                                style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
                              >
                                —
                              </div>
                            </td>
                          );
                        }
                        const r = contrastRatio(row.hex, col.hex);
                        const level = r === null ? null : r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA18" : "Fail";
                        const tone =
                          level === "AAA" || level === "AA"
                            ? { background: "rgba(124,231,172,.12)", color: "var(--success)" }
                            : level === "AA18"
                            ? { background: "rgba(244,190,94,.12)", color: "var(--warning)" }
                            : { background: "rgba(255,128,139,.12)", color: "var(--danger)" };
                        return (
                          <td key={col.id} className="text-center">
                            <div
                              className="w-[64px] h-[34px] rounded-md flex flex-col items-center justify-center leading-none"
                              style={tone}
                              title={r !== null ? `${r.toFixed(2)}:1` : undefined}
                            >
                              <span className="text-[11px] font-semibold">{level}</span>
                              <span className="text-[9px] mt-0.5" style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                                {r !== null ? r.toFixed(1) : "—"}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: "var(--text-faint)" }}>
                <span>{isAr ? "AAA / AA — صالح لكل النصوص" : "AAA / AA — passes for all text"}</span>
                <span>{isAr ? "AA18 — للنص الكبير فقط (18 بكسل فأكثر)" : "AA18 — large text (≥18px) only"}</span>
                <span>{isAr ? "راسب — أقل من 3:1" : "Fail — below 3:1"}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {extracting && <ExtractFromLogoModal ws={ws} onClose={() => setExtracting(false)} />}

      {editor && (
        <ColorEditorModal
          mode={editor.mode}
          initialName={editor.mode === "edit" ? editor.color.name : ""}
          initialHex={editor.mode === "edit" ? editor.color.hex : "#"}
          isPrimary={editor.mode === "edit" && !!editor.color.isPrimary}
          /*
           * Every swatch is deletable. It used to be gated on `locked`, which
           * every seeded colour carries — so the Delete button never appeared
           * on a brand's own palette and nothing on screen said why. Nothing
           * here can actually break: the site falls back to a neutral theme
           * for anything it can no longer find. So the rule is now to state
           * the consequence and let the studio decide.
           */
          consequence={
            editor.mode === "edit"
              ? editor.color.isPrimary
                ? ws.colors.length > 1
                  ? "Deleting the primary hands that role to the next swatch in the palette."
                  : "This is the last colour. Deleting it drops the guideline site back to the neutral fallback theme."
                : editor.color.id === "canvas"
                  ? "The guideline site reads its background from this swatch. Without it, the site falls back to a neutral ground."
                  : undefined
              : undefined
          }
          onSetPrimary={
            editor.mode === "edit"
              ? () => {
                  setPrimaryColor(ws.id, editor.color.id);
                  showToast(`${editor.color.name} is now the primary colour.`, "success");
                  setEditor(null);
                }
              : undefined
          }
          onCancel={() => setEditor(null)}
          onSave={(data) => {
            if (editor.mode === "add") {
              addColor(ws.id, data);
              showToast("Color added.", "success");
            } else {
              updateColor(ws.id, editor.color.id, data);
              showToast("Color updated.", "success");
            }
            setEditor(null);
          }}
          onDelete={
            editor.mode === "edit"
              ? () => {
                  const wasPrimary = !!editor.color.isPrimary;
                  const successor = ws.colors.find((c) => c.id !== editor.color.id);
                  removeColor(ws.id, editor.color.id);
                  showToast(
                    wasPrimary && successor
                      ? `${editor.color.name} removed — ${successor.name} is now the primary colour.`
                      : `${editor.color.name} removed.`
                  );
                  setEditor(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
