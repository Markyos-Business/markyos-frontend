"use client";

import { useAppActions } from "@/contexts/AppContext";
import { Icon, AutoTextarea, EmptyHint, Button, IconButton } from "@/components/ui";
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
  const { setDeptInstructions, uiLang } = useAppActions();
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
    <div className="mk-surface rounded-card p-5 flex flex-col gap-3.5" style={{ background: "var(--surface-1)" }}>
      {/* Wraps on a phone: the actions drop under the heading instead of
          squeezing it into a narrow column. */}
      <div className="flex flex-wrap items-center justify-between gap-ctl-row">
        <div className="flex min-w-0 flex-1 basis-56 flex-col">
          <span className="font-semibold text-[15px]">{isAr ? "صفحة التعليمات" : "Instruction page"}</span>
          <span className="text-[12px] mt-0.5" style={{ color: "var(--text-faint)" }}>
            {isAr
              ? "ما يقرأه موظف جديد في هذا القسم، من أعلى لأسفل."
              : "What someone joining this department reads, top to bottom."}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-ctl-row">
          <Button variant="secondary" size="sm" onClick={onImport} icon={<Icon name="upload" size={16} />}>
            {isAr ? "بناء من ملف" : "Build from file"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => write([...sections, { id: uid(), heading: "", body: "" }])} icon={<Icon name="plus" size={16} />}>
            {isAr ? "قسم" : "Section"}
          </Button>
        </div>
      </div>

      {sections.length === 0 ? (
        <EmptyHint>
          {isAr
            ? "لا توجد أقسام بعد. ارفع دليل القسم ليُبنى تلقائيًا، أو أضف قسمًا واكتبه بنفسك."
            : "No sections yet. Upload this department's handbook to build the page from its own headings, or add a section and write it here."}
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-field-stack-compact">
          {sections.map((s, i) => (
            <div key={s.id} className="mk-surface rounded-card p-3.5 flex flex-col gap-field-stack-compact" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-ctl-row">
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
                  className="mk-field mk-field-sm flex-1 min-w-0 font-semibold bidi-auto"
                />
                <IconButton
                  icon="angle-up"
                  iconSize={16}
                  size="xs"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  label={isAr ? "تحريك للأعلى" : "Move up"}
                  // Obvious on screen from where the row sits; not obvious at
                  // all to someone tabbing through with a screen reader, who
                  // meets a dead control and no explanation of it.
                  title={i === 0 ? (isAr ? "في الأعلى بالفعل" : "Already first") : isAr ? "تحريك للأعلى" : "Move up"}
                  className="text-text-faint"
                />
                <IconButton
                  icon="angle-down"
                  iconSize={16}
                  size="xs"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  label={isAr ? "تحريك للأسفل" : "Move down"}
                  title={i === sections.length - 1 ? (isAr ? "في الأسفل بالفعل" : "Already last") : isAr ? "تحريك للأسفل" : "Move down"}
                  className="text-text-faint"
                />
                <IconButton
                  icon="times"
                  iconSize={16}
                  size="xs"
                  onClick={() => write(sections.filter((x) => x.id !== s.id))}
                  label={isAr ? `إزالة ${s.heading || "القسم"}` : `Remove ${s.heading || "section"}`}
                  title={isAr ? `إزالة ${s.heading || "هذا القسم"}` : `Remove ${s.heading || "this section"}`}
                  className="text-text-faint mk-danger-hover"
                />
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
                className="mk-field w-full font-normal leading-prose"
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
