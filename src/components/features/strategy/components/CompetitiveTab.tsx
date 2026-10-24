"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, useDialog, Icon, AutoTextarea } from "@/components/ui";
import { Section, EmptyHint } from "@/components/ui/composites/SectionUI";
import { CompetitorColumn, Lang, Workspace } from "@/types";
import { uid } from "@/lib/utils";
import { useModalDismiss } from "@/hooks/useModalDismiss";

/**
 * Competitive analysis as an actual comparison table.
 *
 * It used to be a list of name + one free-text note, which is a competitor
 * *log*, not an analysis — you can't compare two brands on price or Arabic
 * support by reading two paragraphs. The columns are the studio's to define,
 * because what a category turns on differs by category.
 */
export function CompetitiveTab({ ws, lang }: { ws: Workspace; lang: Lang }) {
  const { addCompetitor, removeCompetitor, updateCompetitor, setCompetitorColumns } = useApp();
  const { showToast } = useToast();
  const { prompt } = useDialog();
  const [pasteOpen, setPasteOpen] = useState(false);

  // `isAr` here means "the Arabic copy is open", not "the interface is Arabic":
  // the two are independent, and this table writes whichever copy is open.
  const isAr = lang === "ar";
  const columns = ws.strategy.competitorColumns;
  const rows = ws.strategy.competitors;

  const cellValue = (competitorId: string, colId: string) => {
    const c = rows.find((r) => r.id === competitorId);
    if (!c) return "";
    if (colId === "notes") return (isAr ? c.notesAr : c.notes) ?? "";
    return (isAr ? c.cellsAr?.[colId] : c.cells?.[colId]) ?? "";
  };

  const writeCell = (competitorId: string, colId: string, value: string) => {
    // "notes" is backed by its own long-standing field; everything else lives
    // in the open `cells` map keyed by column id. Each has an Arabic twin, so
    // editing the Arabic copy never overwrites the English one.
    if (colId === "notes") {
      updateCompetitor(ws.id, competitorId, isAr ? { notesAr: value } : { notes: value });
      return;
    }
    updateCompetitor(ws.id, competitorId, isAr ? { cellsAr: { [colId]: value } } : { cells: { [colId]: value } });
  };

  /** A column's heading in the copy being edited, falling back to the other. */
  const columnLabel = (col: CompetitorColumn) => (isAr ? col.labelAr || col.label : col.label);

  async function addColumn() {
    const label = await prompt({
      title: isAr ? "عمود جديد" : "New column",
      label: isAr ? "اسم العمود" : "Column name",
      placeholder: isAr ? "التسعير" : "Pricing",
      confirmLabel: isAr ? "إضافة" : "Add column",
      isAr,
    });
    if (!label) return;
    setCompetitorColumns(ws.id, [...columns, { id: uid(), label }]);
  }

  async function renameColumn(col: CompetitorColumn) {
    const label = await prompt({
      title: isAr ? "إعادة تسمية العمود" : "Rename column",
      label: isAr ? "اسم العمود" : "Column name",
      initialValue: columnLabel(col),
      confirmLabel: isAr ? "حفظ" : "Save",
      isAr,
    });
    if (!label) return;
    setCompetitorColumns(
      ws.id,
      columns.map((c) => (c.id === col.id ? { ...c, ...(isAr ? { labelAr: label } : { label }) } : c))
    );
  }

  function removeColumn(col: CompetitorColumn) {
    setCompetitorColumns(ws.id, columns.filter((c) => c.id !== col.id));
    showToast(
      isAr
        ? `أُزيل عمود ${columnLabel(col)}. القيم المكتوبة فيه لم تُحذف.`
        : `Removed the ${columnLabel(col)} column. What was written in it is kept, in case you add it back.`
    );
  }

  function moveColumn(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target], next[index]];
    setCompetitorColumns(ws.id, next);
  }

  return (
    <Section
      title={isAr ? "تحليل المنافسين" : "Competitive analysis"}
      icon="chart-line"
      right={
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPasteOpen(true)} className="mk-tap text-[12px] font-semibold cursor-pointer" style={{ color: "var(--text-muted)" }}>
            {isAr ? "لصق جدول" : "Paste a table"}
          </button>
          <button type="button" onClick={() => void addColumn()} className="mk-tap text-[12px] font-semibold cursor-pointer" style={{ color: "var(--text-muted)" }}>
            {isAr ? "+ عمود" : "+ Column"}
          </button>
          <button
            type="button"
            onClick={() => addCompetitor(ws.id, { name: isAr ? "منافس جديد" : "New competitor" })}
            className="mk-tap text-[12px] font-semibold cursor-pointer"
            style={{ color: "var(--accent-text)" }}
          >
            {isAr ? "+ منافس" : "+ Competitor"}
          </button>
        </div>
      }
    >
      <p className="text-[13px] -mt-1" style={{ color: "var(--text-muted)" }}>
        {isAr
          ? "أضف الأعمدة التي يُقارَن عليها هذا السوق فعلًا — السعر، دعم العربية، قناة البيع — ثم املأ الشبكة."
          : "Add the columns this market is actually compared on — price, Arabic support, channel — then fill the grid. Every cell is editable in place."}
      </p>

      {rows.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا يوجد منافسون بعد — من الذي تنافسه هذه العلامة فعلًا؟"
            : "No competitors yet — who is this brand actually up against?"}
        </EmptyHint>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full border-collapse" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th className="text-start p-0" style={{ minWidth: 150 }}>
                  <span className="text-[11px] font-semibold uppercase px-2.5 py-2 inline-block" style={{ letterSpacing: ".06em", color: "var(--text-faint)" }}>
                    {isAr ? "المنافس" : "Competitor"}
                  </span>
                </th>
                {columns.map((col, i) => (
                  <th key={col.id} className="text-start p-0" style={{ minWidth: 160 }}>
                    <div className="flex items-center gap-1 px-2.5 py-2 group">
                      <button
                        type="button"
                        onClick={() => void renameColumn(col)}
                        title={isAr ? "إعادة تسمية" : "Rename this column"}
                        className="mk-tap text-[11px] font-semibold uppercase cursor-pointer text-start truncate"
                        style={{ letterSpacing: ".06em", color: "var(--text-faint)" }}
                      >
                        {columnLabel(col)}
                      </button>
                      <span className="flex items-center ms-auto shrink-0">
                        <button type="button" onClick={() => moveColumn(i, -1)} disabled={i === 0} aria-label="Move column left" className="mk-icon-btn cursor-pointer disabled:opacity-20 disabled:cursor-default" style={{ color: "var(--text-faint)" }}>
                          <Icon name="angle-left" size={11} />
                        </button>
                        <button type="button" onClick={() => moveColumn(i, 1)} disabled={i === columns.length - 1} aria-label="Move column right" className="mk-icon-btn cursor-pointer disabled:opacity-20 disabled:cursor-default" style={{ color: "var(--text-faint)" }}>
                          <Icon name="angle-right" size={11} />
                        </button>
                        <button type="button" onClick={() => removeColumn(col)} aria-label={`Remove ${columnLabel(col)} column`} className="mk-icon-btn cursor-pointer" style={{ color: "var(--text-faint)" }}>
                          <Icon name="times" size={10} />
                        </button>
                      </span>
                    </div>
                  </th>
                ))}
                <th style={{ width: 34 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="align-top p-1">
                    <Cell
                      value={(isAr ? c.nameAr : c.name) ?? ""}
                      bold
                      label={isAr ? "اسم المنافس" : "Competitor name"}
                      placeholder={isAr ? "الاسم" : "Name"}
                      onCommit={(v) => updateCompetitor(ws.id, c.id, isAr ? { nameAr: v } : { name: v })}
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.id} className="align-top p-1">
                      <Cell
                        value={cellValue(c.id, col.id)}
                        label={`${col.label} — ${(isAr ? c.nameAr : c.name) || (isAr ? "منافس بلا اسم" : "unnamed competitor")}`}
                        placeholder="—"
                        onCommit={(v) => writeCell(c.id, col.id, v)}
                      />
                    </td>
                  ))}
                  <td className="align-top p-1">
                    <button
                      type="button"
                      onClick={() => removeCompetitor(ws.id, c.id)}
                      aria-label={`Remove ${c.name}`}
                      title={`Remove ${c.name}`}
                      className="w-7 h-7 grid place-items-center rounded-full cursor-pointer mk-danger-hover"
                      style={{ color: "var(--text-faint)" }}
                    >
                      <Icon name="times" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pasteOpen && <PasteTableModal ws={ws} onClose={() => setPasteOpen(false)} />}
    </Section>
  );
}

/** One editable grid cell: grows with its content, commits on blur. */
function Cell({
  value,
  placeholder,
  label,
  bold,
  onCommit,
}: {
  value: string;
  placeholder: string;
  /**
   * Which cell this is, as a sentence.
   *
   * A grid of boxes whose only name is "—" is the worst case for reading a
   * table without seeing it: the row and column headers are on screen but
   * nothing connects them to the box you are typing in.
   */
  label: string;
  bold?: boolean;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <AutoTextarea
      minRows={1}
      caretAtEnd={false}
      value={draft ?? value}
      aria-label={label}
      placeholder={placeholder}
      onChange={setDraft}
      onBlur={() => {
        if (draft !== null && draft !== value) onCommit(draft.trim());
        setDraft(null);
      }}
      className="rounded-lg px-2.5 py-2 outline-none text-[12.5px] leading-[1.55] w-full"
      style={{
        background: "var(--surface-2)",
        color: bold ? "var(--text)" : "var(--text-secondary)",
        fontWeight: bold ? 600 : 400,
      }}
    />
  );
}

/**
 * Builds the whole table from a spreadsheet paste.
 *
 * Studios keep this analysis in Sheets or Excel long before it reaches a
 * guideline, and retyping a 6×5 grid cell by cell is the reason it never gets
 * moved. Tab-separated is what both actually put on the clipboard.
 */
function PasteTableModal({ ws, onClose }: { ws: Workspace; onClose: () => void }) {
  const { setCompetitorColumns, addCompetitor, removeCompetitor, uiLang } = useApp();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(true);
  const existing = useRef(ws.strategy.competitors.map((c) => c.id));

  const isAr = uiLang(ws) === "ar";
  const grid = text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => l.split(/\t|\s*\|\s*|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.trim().replace(/^"|"$/g, "")));

  const header = grid[0] ?? [];
  const body = grid.slice(1);

  function apply() {
    if (header.length < 2 || body.length === 0) {
      showToast(
        isAr ? "يحتاج الجدول إلى صف عناوين وصف بيانات واحد على الأقل." : "Needs a header row and at least one data row.",
        "danger"
      );
      return;
    }
    const cols: CompetitorColumn[] = header.slice(1).map((label) => ({ id: uid(), label: label || "Column" }));
    setCompetitorColumns(ws.id, cols);
    if (replace) for (const id of existing.current) removeCompetitor(ws.id, id);
    for (const row of body) {
      const cells: Record<string, string> = {};
      cols.forEach((col, i) => {
        cells[col.id] = row[i + 1] ?? "";
      });
      addCompetitor(ws.id, { name: row[0] || "—", cells });
    }
    showToast(
      isAr ? `أُضيف ${body.length} منافسًا في ${cols.length} عمودًا.` : `Built ${body.length} rows × ${cols.length} columns.`,
      "success"
    );
    onClose();
  }

  useModalDismiss(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ background: "var(--scrim)" }} onClick={onClose}>
      <div
        className="w-full max-w-[600px] max-h-[86vh] rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--canvas)", boxShadow: "0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {isAr ? "لصق جدول" : "Paste a table"}
            </h2>
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>
              {isAr
                ? "انسخ من Excel أو Google Sheets والصق هنا. الصف الأول هو العناوين، والعمود الأول هو اسم المنافس."
                : "Copy from Excel or Google Sheets and paste. First row = column names, first column = competitor name."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="mk-icon-btn cursor-pointer">
            <Icon name="times" size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <textarea
          autoFocus
          dir="auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={"Competitor\tPrice\tArabic support\nDual Studio\t$$\tNone"}
          className="rounded-lg p-3 outline-none text-[12.5px] resize-y bidi-auto"
          style={{ background: "var(--surface-2)", color: "var(--text)", fontFamily: "ui-monospace, Menlo, monospace" }}
        />

        {grid.length > 0 && (
          <div className="rounded-xl p-3 overflow-x-auto" style={{ background: "var(--surface-1)" }}>
            <table className="border-collapse text-[11.5px]">
              <tbody>
                {grid.slice(0, 6).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="px-2.5 py-1.5 whitespace-nowrap"
                        style={{
                          boxShadow: "inset 0 0 0 1px var(--hairline)",
                          fontWeight: ri === 0 || ci === 0 ? 600 : 400,
                          color: ri === 0 ? "var(--text)" : "var(--text-secondary)",
                        }}
                      >
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] mt-2" style={{ color: "var(--text-faint)" }}>
              {isAr
                ? `${body.length} صفًا × ${Math.max(0, header.length - 1)} عمودًا`
                : `${body.length} competitor${body.length === 1 ? "" : "s"} × ${Math.max(0, header.length - 1)} column${header.length - 1 === 1 ? "" : "s"}`}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2.5 text-[12.5px] cursor-pointer" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          {isAr ? "استبدل المنافسين الحاليين" : "Replace the competitors already in the table"}
        </label>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
            style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline)" }}
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={body.length === 0}
            className="h-11 px-5 rounded-full text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--solid)", color: "var(--solid-ink)" }}
          >
            {isAr ? "بناء الجدول" : "Build the table"}
          </button>
        </div>
      </div>
    </div>
  );
}
