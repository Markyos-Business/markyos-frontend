"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon, PillButton } from "@/components/ui";
import { DepartmentView, Workspace } from "@/types";
import { extractText, parseDocumentSections } from "@/lib/docParse";
import { uid } from "@/lib/utils";
import { useModalDismiss } from "@/hooks/useModalDismiss";

interface Row {
  heading: string;
  body: string;
  include: boolean;
}

type Step = "pick" | "parsing" | "review";

/**
 * Turns an uploaded department handbook into an instruction page.
 *
 * Unlike the Strategy importer this has no vocabulary to match against — a
 * department's headings *are* its structure, whatever they happen to be — so
 * it keeps them as written and only decides where one section ends and the
 * next begins.
 */
export function ImportInstructionsModal({
  ws,
  view,
  onClose,
}: {
  ws: Workspace;
  view: DepartmentView;
  onClose: () => void;
}) {
  const { setDeptInstructions, uiLang } = useApp();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("pick");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [mode, setMode] = useState<"replace" | "append">(view.instructionSections.length ? "append" : "replace");

  const isAr = uiLang(ws) === "ar";
  const selected = rows.filter((r) => r.include && (r.heading.trim() || r.body.trim()));

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    setStep("parsing");
    try {
      const text = await extractText(file);
      const sections = parseDocumentSections(text);
      if (sections.length === 0) {
        setError(
          isAr
            ? "لم يُعثر على أقسام في هذا الملف — جرّب ملفًا بعناوين واضحة."
            : "No sections found in that file — try one with clear headings."
        );
        setStep("pick");
        return;
      }
      setRows(
        sections.map((s) => ({
          // A leading block with no heading of its own is the handbook's intro.
          heading: s.heading || (isAr ? "مقدمة" : "Introduction"),
          body: s.body,
          include: true,
        }))
      );
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
      setStep("pick");
    }
  }

  function apply() {
    const built = selected.map((r) => ({
      id: uid(),
      heading: r.heading.trim(),
      body: r.body.trim(),
      sourceFileName: fileName,
    }));
    setDeptInstructions(
      ws.id,
      view.id,
      mode === "replace" ? built : [...view.instructionSections, ...built]
    );
    showToast(
      isAr
        ? `تمت إضافة ${built.length} قسمًا إلى ${view.name}.`
        : `Built ${built.length} section${built.length === 1 ? "" : "s"} for ${view.name}.`,
      "success"
    );
    onClose();
  }

  useModalDismiss(onClose);

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-8 animate-backdrop-in"
      style={{ background: "var(--scrim)" }}
      onClick={onClose}
    >
      <div
        className="animate-modal-in w-full max-w-[580px] max-h-[86vh] rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--canvas)", boxShadow: "0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {isAr ? "بناء صفحة التعليمات" : "Build the instruction page"}
            </h2>
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>
              {isAr ? `من ملف — لقسم ${view.name}` : `From a file — for ${view.name}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="mk-icon-btn cursor-pointer">
            <Icon name="times" size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {step === "pick" && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              {isAr
                ? "يقرأ ماركيوس عناوين المستند ويحوّل كل عنوان إلى قسم في صفحة تعليمات هذا القسم. العناوين تبقى كما كُتبت."
                : "Markyos reads the document's own headings and turns each one into a section of this department's instruction page. The headings stay exactly as written — nothing is renamed or summarised."}
            </p>
            {error && (
              <div
                className="rounded-lg px-3.5 py-2.5 text-[12.5px]"
                style={{ background: "rgba(255,128,139,.12)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".docx,.pdf,.md,.txt,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-10 cursor-pointer"
              style={{ borderColor: "var(--hairline-strong)" }}
            >
              <Icon name="file-alt" size={22} style={{ color: "var(--text-faint)" }} />
              <span className="text-[13px] font-medium">
                {isAr ? "اختر ملفًا" : "Choose a .docx, .pdf, .md or .txt file"}
              </span>
            </button>
          </div>
        )}

        {step === "parsing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Icon name="circle-notch" size={22} className="animate-spin" style={{ color: "var(--accent-text)" }} />
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {isAr ? `جارٍ قراءة ${fileName}…` : `Reading ${fileName}…`}
            </span>
          </div>
        )}

        {step === "review" && (
          <>
            {view.instructionSections.length > 0 && (
              <div className="flex gap-1.5 shrink-0">
                {(["append", "replace"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className="h-8 px-3.5 rounded-full text-[12px] font-semibold cursor-pointer"
                    style={{
                      background: mode === m ? "var(--solid)" : "var(--surface-2)",
                      color: mode === m ? "var(--solid-ink)" : "var(--text-muted)",
                    }}
                  >
                    {m === "append"
                      ? isAr
                        ? `أضف إلى ${view.instructionSections.length} قسمًا`
                        : `Add to the existing ${view.instructionSections.length}`
                      : isAr
                        ? "استبدل الكل"
                        : "Replace all"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2.5 overflow-y-auto pe-1 -me-1">
              {rows.map((r, i) => (
                <div key={i} className="mk-surface rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: "var(--surface-2)" }}>
                  <input
                    type="checkbox"
                    checked={r.include}
                    className="mt-1.5"
                    onChange={(e) =>
                      setRows((prev) => prev.map((x, xi) => (xi === i ? { ...x, include: e.target.checked } : x)))
                    }
                  />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <input
                      dir="auto"
                      value={r.heading}
                      onChange={(e) =>
                        setRows((prev) => prev.map((x, xi) => (xi === i ? { ...x, heading: e.target.value } : x)))
                      }
                      className="h-8 px-2.5 rounded-md outline-none text-[13px] font-semibold bidi-auto"
                      style={{ background: "var(--surface-1)", color: "var(--text)" }}
                    />
                    <textarea
                      dir="auto"
                      value={r.body}
                      rows={Math.min(6, Math.max(2, Math.ceil(r.body.length / 70)))}
                      onChange={(e) =>
                        setRows((prev) => prev.map((x, xi) => (xi === i ? { ...x, body: e.target.value } : x)))
                      }
                      className="rounded-md p-2.5 outline-none text-[12.5px] resize-none leading-[1.6] bidi-auto"
                      style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2.5 shrink-0 pt-1">
              <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                {isAr
                  ? `${rows.length} قسمًا في ${fileName}`
                  : `${rows.length} section${rows.length === 1 ? "" : "s"} found in ${fileName}`}
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
                  style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline)" }}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <PillButton variant="primary" size="md" onClick={apply} disabled={selected.length === 0}>
                  {isAr ? `أضف ${selected.length}` : `Add ${selected.length} section${selected.length === 1 ? "" : "s"}`}
                </PillButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
