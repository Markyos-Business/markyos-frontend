"use client";

import { useApp } from "@/contexts/AppContext";
import { Icon, AutoTextarea } from "@/components/ui";
import { EmptyHint } from "@/components/ui/composites/SectionUI/SectionUI";
import { DepartmentView, DeptInstructionSection, Workspace } from "@/types";
import { uid } from "@/lib/utils";

/**
 * Edits the ordered blocks of a department's instruction page.
 *
 * Every change writes the whole list back through one action rather than
 * needing a store action per operation — the list is small, always fully in
 * hand, and this keeps add/edit/remove/reorder from drifting apart.
 */
export function InstructionEditor({
  ws,
  view,
  onImport,
}: {
  ws: Workspace;
  view: DepartmentView;
  onImport: () => void;
}) {
  const { setDeptInstructions, uiLang } = useApp();
  const isAr = uiLang(ws) === "ar";
  const sections = view.instructionSections;

  function write(next: DeptInstructionSection[]) {
    setDeptInstructions(ws.id, view.id, next);
  }

  function update(id: string, patch: Partial<DeptInstructionSection>) {
    write(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    write(next);
  }

  return (
    <div className="mk-surface rounded-2xl p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-semibold text-[15px]">{isAr ? "صفحة التعليمات" : "Instruction page"}</span>
          <span className="text-[12px] mt-0.5" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "ما يقرأه موظف جديد في هذا القسم، من أعلى لأسفل."
              : "What someone joining this department reads, top to bottom."}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onImport}
            className="h-8 px-3 rounded-full text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            <Icon name="upload" size={12} />
            {isAr ? "بناء من ملف" : "Build from file"}
          </button>
          <button
            type="button"
            onClick={() => write([...sections, { id: uid(), heading: "", body: "" }])}
            className="h-8 px-3 rounded-full text-[12px] font-semibold cursor-pointer flex items-center gap-1.5"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            <Icon name="plus" size={12} />
            {isAr ? "قسم" : "Section"}
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا توجد أقسام بعد. ارفع دليل القسم ليُبنى تلقائيًا، أو أضف قسمًا واكتبه بنفسك."
            : "No sections yet. Upload this department's handbook to build the page from its own headings, or add a section and write it here."}
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sections.map((s, i) => (
            <div key={s.id} className="mk-surface rounded-xl p-3.5 flex flex-col gap-2" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold shrink-0"
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--accent-text)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  dir="auto"
                  value={s.heading}
                  // Numbered rather than generic: there are several of these
                  // down the page and "Section heading" five times over tells
                  // you nothing about which one you are in.
                  aria-label={
                    isAr
                      ? `عنوان القسم ${i + 1}`
                      : `Heading for section ${i + 1}`
                  }
                  placeholder={isAr ? "عنوان القسم" : "Section heading"}
                  onChange={(e) => update(s.id, { heading: e.target.value })}
                  className="flex-1 min-w-0 h-8 px-2.5 rounded-md outline-none text-[13px] font-semibold bidi-auto"
                  style={{ background: "var(--surface-1)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  // Obvious on screen from where the row sits; not obvious at
                  // all to someone tabbing through with a screen reader, who
                  // meets a dead control and no explanation of it.
                  title={i === 0 ? "Already first" : "Move up"}
                  className="w-7 h-7 grid place-items-center rounded-full cursor-pointer disabled:opacity-25 disabled:cursor-default"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Icon name="angle-up" size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  aria-label="Move down"
                  title={i === sections.length - 1 ? "Already last" : "Move down"}
                  className="w-7 h-7 grid place-items-center rounded-full cursor-pointer disabled:opacity-25 disabled:cursor-default"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Icon name="angle-down" size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => write(sections.filter((x) => x.id !== s.id))}
                  aria-label={`Remove ${s.heading || "section"}`}
                  title={`Remove ${s.heading || "this section"}`}
                  className="w-7 h-7 grid place-items-center rounded-full cursor-pointer mk-danger-hover"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Icon name="times" size={12} />
                </button>
              </div>
              <AutoTextarea
                value={s.body}
                minRows={3}
                caretAtEnd={false}
                aria-label={
                  isAr
                    ? `تعليمات ${s.heading || `القسم ${i + 1}`}`
                    : `Instructions for ${s.heading || `section ${i + 1}`}`
                }
                placeholder={isAr ? "اكتب التعليمات هنا…" : "Write the instructions for this section…"}
                onChange={(v) => update(s.id, { body: v })}
                className="rounded-md p-3 outline-none text-[13px] leading-[1.7]"
                style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}
              />
              {s.sourceFileName && (
                <span className="text-[10.5px]" style={{ color: "var(--text-faint)" }}>
                  {isAr ? `من ${s.sourceFileName}` : `from ${s.sourceFileName}`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
