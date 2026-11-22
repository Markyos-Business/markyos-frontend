"use client";

import { useState } from "react";
import { useAppActions } from "@/contexts/AppContext";
import { useToast, Icon, PageHeader, Button, IconButton } from "@/components/ui";
import { ColorEditorModal } from "./color-editor-modal";
import { ExtractFromLogoModal } from "./extract-from-logo-modal";
import { ContrastReport } from "@/features/guideline-site";
import { ColorSwatch, SlotKind, Workspace } from "@/types";
import { contrastRatio, hexToRgb, rgbToCmyk } from "@/lib/utils";
import { useColorNameTranslations } from "../../hooks/use-color-name-translations";
import { nameLang } from "@/lib/data/colorNames";
import { plural } from "@/lib/i18n/plural";

type EditorState = { mode: "add" } | { mode: "edit"; color: ColorSwatch };

export function ColorContent({ ws }: { ws: Workspace }) {
  const { addColor, updateColor, removeColor, setPrimaryColor, uiLang } = useAppActions();
  useColorNameTranslations(ws);
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
      showToast(isAr ? `تم نسخ ${label}: ${value}` : `${label} copied: ${value}`, "success");
    } catch {
      showToast(isAr ? "تعذّر النسخ. انسخه يدويًا." : "Couldn't copy. Copy it manually.", "danger");
    }
  }

  return (
    <div className="flex-1 min-h-0 px-7 py-6.5 flex flex-col gap-5 overflow-auto">
      <PageHeader
        title={isAr ? "الألوان" : "Colour"}
        description={isAr
              ? `${plural("ar", ws.colors.length, { zero: "لا ألوان", one: "لون واحد", two: "لونان", few: "{n} ألوان", many: "{n} لونًا", other: "{n} لون" })} · اضغط على أي رمز لنسخه، أو على القلم لتعديله.`
              : `${plural("en", ws.colors.length, { one: "{n} colour", other: "{n} colours" })} · click a code to copy it, or the pencil to edit.`}
        actions={<>
        <div className="flex gap-ctl-row">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setExtracting(true)}
            title={hasArtwork ? (isAr ? "اقرأ الألوان الموجودة فعليًا في الشعار" : "Read the colours actually present in your logo") : undefined}
            // Says why on hover and focus, not only in a title nobody sees on a disabled button.
            disabledReason={hasArtwork ? undefined : isAr ? "ارفع شعارًا أولًا" : "Upload a logo first"}
            icon={<Icon name="palette" size={18} className="text-accent-text" />}
          >
            {isAr ? "من الشعار" : "Pick from logo"}
          </Button>
          <Button variant="primary" size="md" icon={<Icon name="plus" size={18} />} onClick={() => setEditor({ mode: "add" })}>
            {isAr ? "أضف لونًا" : "Add colour"}
          </Button>
        </div>
        </>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ws.colors.map((c) => {
          const rgb = hexToRgb(c.hex);
          const cmyk = rgb ? rgbToCmyk(rgb) : null;
          return (
            <div key={c.id} className="rounded-card overflow-hidden bg-surface-1" >
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
                <div className="flex items-center justify-between gap-ctl-row">
                  <span className="font-semibold text-[14px] truncate">{c.name}</span>
                  <div className="flex items-center gap-ctl-row shrink-0">
                    {c.isPrimary && (
                      <span
                        className="text-[10px] font-medium px-2 py-[5px] rounded-md"
                        style={{ letterSpacing: ".08em", background: "var(--accent-soft)", color: "var(--accent-on-soft)" }}
                      >
                        {isAr ? "أساسي" : "PRIMARY"}
                      </span>
                    )}
                    <IconButton
                      icon="pen"
                      iconSize={16}
                      size="xs"
                      onClick={() => setEditor({ mode: "edit", color: c })}
                      label={`Edit ${c.name}`}
                      title={`Edit, set primary, or delete ${c.name}`}
                    />
                  </div>
                </div>
                <div
                  dir="ltr"
                  className="flex flex-col text-[11px]"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}
                >
                  <button /* button-audit-ignore: the colour value itself, clicked to copy */
                    type="button"
                    onClick={() => copyValue("HEX", c.hex.toUpperCase())}
                    title={isAr ? `نسخ قيمة HEX للون ${c.name}` : `Copy the HEX value for ${c.name}`}
                    className="mk-tap text-start cursor-pointer hover:text-text"
                  >
                    {c.hex.toUpperCase()}
                  </button>
                  <button /* button-audit-ignore: the colour value itself, clicked to copy */
                    type="button"
                    disabled={!rgb}
                    onClick={() => rgb && copyValue("RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                    title={rgb ? (isAr ? `نسخ قيمة RGB للون ${c.name}` : `Copy the RGB value for ${c.name}`) : undefined}
                    className="mk-tap text-start cursor-pointer hover:text-text disabled:cursor-default"
                  >
                    {rgb ? `${rgb.r} · ${rgb.g} · ${rgb.b}` : "—"}
                  </button>
                  <button /* button-audit-ignore: the colour value itself, clicked to copy */
                    type="button"
                    disabled={!cmyk}
                    onClick={() =>
                      cmyk && copyValue("CMYK", `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`)
                    }
                    title={cmyk ? (isAr ? `نسخ قيمة CMYK للون ${c.name}` : `Copy the CMYK value for ${c.name}`) : undefined}
                    className="mk-tap text-start cursor-pointer hover:text-text disabled:cursor-default"
                  >
                    {cmyk ? `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}` : "—"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <button /* button-audit-ignore: the add tile at the end of the swatch grid, a card not a button */
          type="button"
          onClick={() => setEditor({ mode: "add" })}
          className="rounded-card flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-edge text-text-muted min-h-55"
          
        >
          <Icon name="plus" size={22} />
          <span className="text-[13px] font-medium">{isAr ? "أضف لونًا" : "Add colour"}</span>
        </button>
      </div>

      {/* Contrast sits right under the palette because that is where the fix
          is: a failing ratio is a swatch to change. Under it, not above it, so
          the colours themselves are the first thing on the page. */}
      {ws.colors.length > 0 && (
        <div className="mk-surface rounded-card bg-surface-1 p-5">
          <ContrastReport ws={ws} isAr={isAr} />
        </div>
      )}

      {ratio !== null && (
        <div className="flex flex-col gap-2.5">
          <button /* button-audit-ignore: a full-width summary row that opens the contrast matrix */
            type="button"
            onClick={() => setShowReport((v) => !v)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-card cursor-pointer text-start bg-surface-1"
            
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
            <div className="rounded-card p-4 overflow-x-auto bg-surface-1" >
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
                            ? { background: "var(--success-soft)", color: "var(--success)" }
                            : level === "AA18"
                            ? { background: "rgba(244,190,94,.12)", color: "var(--warning)" }
                            : { background: "var(--danger-soft)", color: "var(--danger)" };
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
          isAr={isAr}
          initialName={editor.mode === "edit" ? editor.color.name : ""}
          initialTranslation={
            editor.mode === "edit" && editor.color.nameTranslation?.source === editor.color.name ? editor.color.nameTranslation.text : ""
          }
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
                  ? isAr
                    ? "حذف اللون الأساسي ينقل دوره إلى اللون التالي في اللوحة."
                    : "Deleting the primary hands that role to the next swatch in the palette."
                  : isAr
                    ? "هذا آخر لون. حذفه يعيد موقع الدليل إلى السمة المحايدة الاحتياطية."
                    : "This is the last colour. Deleting it drops the guideline site back to the neutral fallback theme."
                : editor.color.id === "canvas"
                  ? isAr
                    ? "يأخذ موقع الدليل خلفيته من هذا اللون. بدونه يعود الموقع إلى خلفية محايدة."
                    : "The guideline site reads its background from this swatch. Without it, the site falls back to a neutral ground."
                  : undefined
              : undefined
          }
          onSetPrimary={
            editor.mode === "edit"
              ? () => {
                  setPrimaryColor(ws.id, editor.color.id);
                  showToast(isAr ? `أصبح ${editor.color.name} اللون الأساسي.` : `${editor.color.name} is now the primary colour.`, "success");
                  setEditor(null);
                }
              : undefined
          }
          onCancel={() => setEditor(null)}
          onSave={({ translation, ...data }) => {
            // A typed translation is kept as current for this name, so the
            // translator leaves it alone; empty leaves it to the translator.
            const nameTranslation = translation
              ? { lang: nameLang(data.name) === "ar" ? ("en" as const) : ("ar" as const), text: translation, source: data.name }
              : undefined;
            if (editor.mode === "add") {
              addColor(ws.id, { ...data, ...(nameTranslation ? { nameTranslation } : {}) });
              showToast(isAr ? "تمت إضافة اللون." : "Colour added.", "success");
            } else {
              updateColor(ws.id, editor.color.id, nameTranslation ? { ...data, nameTranslation } : data);
              showToast(isAr ? "تم تحديث اللون." : "Colour updated.", "success");
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
                      ? isAr
                        ? `تم حذف ${editor.color.name}، وأصبح ${successor.name} اللون الأساسي.`
                        : `${editor.color.name} removed. ${successor.name} is now the primary colour.`
                      : isAr
                        ? `تم حذف ${editor.color.name}.`
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
