"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useToast, Icon, Button } from "@/components/ui";
import { Workspace } from "@/types";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import {
  extractText,
  parseStrategyDocument,
  ParsedListItem,
  ParsedPersona,
  ParsedStrategy,
  ParsedVoiceTrait,
  SingleStrategyKey,
} from "@/lib/docParse";

const SINGLE_LABELS: Record<SingleStrategyKey, string> = {
  purpose: "Purpose",
  vision: "Vision",
  mission: "Mission",
  targetAudienceSummary: "Target audience",
  positioningStatement: "Brand positioning",
  uvp: "Unique value proposition",
};

interface SingleRow {
  key: SingleStrategyKey;
  label: string;
  value: string;
  /** The literal heading in the document this came from. */
  heading?: string;
  include: boolean;
}

interface ListRow extends ParsedListItem {
  include: boolean;
}
interface PersonaRow extends ParsedPersona {
  include: boolean;
}
interface VoiceRow extends ParsedVoiceTrait {
  include: boolean;
}

type Step = "pick" | "parsing" | "review";

export function ImportStrategyModal({ ws, onClose }: { ws: Workspace; onClose: () => void }) {
  const { setStrategyText, addCoreValue, addCompetitor, addPersona, addVoiceTrait, uiLang } = useApp();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("pick");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [singles, setSingles] = useState<SingleRow[]>([]);
  const [coreValues, setCoreValues] = useState<ListRow[]>([]);
  const [competitors, setCompetitors] = useState<ListRow[]>([]);
  const [personas, setPersonas] = useState<PersonaRow[]>([]);
  const [voiceTraits, setVoiceTraits] = useState<VoiceRow[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  const isAr = uiLang(ws) === "ar";
  const nothingDetected =
    step === "review" &&
    singles.length === 0 &&
    coreValues.length === 0 &&
    competitors.length === 0 &&
    personas.length === 0 &&
    voiceTraits.length === 0;

  const selectedCount =
    singles.filter((s) => s.include && s.value.trim()).length +
    coreValues.filter((v) => v.include && v.title.trim()).length +
    competitors.filter((c) => c.include && c.title.trim()).length +
    personas.filter((p) => p.include && p.name.trim()).length +
    voiceTraits.filter((t) => t.include && t.trait.trim()).length;

  function load(parsed: ParsedStrategy) {
    setSingles(
      (Object.keys(SINGLE_LABELS) as SingleStrategyKey[])
        .filter((k) => parsed[k])
        .map((k) => ({
          key: k,
          label: SINGLE_LABELS[k],
          value: parsed[k] as string,
          heading: parsed.headings[k],
          include: true,
        }))
    );
    setCoreValues((parsed.coreValues ?? []).map((v) => ({ ...v, include: true })));
    setCompetitors((parsed.competitors ?? []).map((c) => ({ ...c, include: true })));
    setPersonas((parsed.personas ?? []).map((p) => ({ ...p, include: true })));
    setVoiceTraits((parsed.voiceTraits ?? []).map((t) => ({ ...t, include: true })));
    setUnmatched(parsed.unmatched);
  }

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    setStep("parsing");
    try {
      const text = await extractText(file);
      load(parseStrategyDocument(text));
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
      setStep("pick");
    }
  }

  function apply() {
    let count = 0;
    for (const s of singles) {
      if (s.include && s.value.trim()) {
        setStrategyText(ws.id, s.key, s.value.trim());
        count++;
      }
    }
    for (const v of coreValues) {
      if (v.include && v.title.trim()) {
        addCoreValue(ws.id, { title: v.title.trim(), description: v.description.trim() });
        count++;
      }
    }
    for (const c of competitors) {
      if (c.include && c.title.trim()) {
        addCompetitor(ws.id, { name: c.title.trim(), notes: c.description.trim() });
        count++;
      }
    }
    for (const p of personas) {
      if (p.include && p.name.trim()) {
        addPersona(ws.id, { name: p.name.trim(), role: p.role.trim(), description: p.description.trim() });
        count++;
      }
    }
    for (const t of voiceTraits) {
      if (t.include && t.trait.trim()) {
        addVoiceTrait(ws.id, {
          trait: t.trait.trim(),
          doExample: t.doExample.trim(),
          dontExample: t.dontExample.trim(),
        });
        count++;
      }
    }
    if (count > 0) {
      showToast(`Imported ${count} item${count === 1 ? "" : "s"} from ${fileName}.`, "success");
      onClose();
    } else {
      showToast("Nothing selected to import.", "danger");
    }
  }

  useModalDismiss(onClose);

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-8 animate-fade-in"
      style={{ background: "var(--scrim)" }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in w-full max-w-[580px] max-h-[86vh] rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--canvas)", boxShadow: "0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {isAr ? "استيراد من ملف" : "Import from file"}
            </h2>
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--text-faint)" }}>
              {isAr
                ? "املأ حقول الاستراتيجية من ملف .docx أو .pdf أو .md"
                : "Fill Strategy fields from a .docx, .pdf, .md or .txt document"}
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
                ? "يبحث ماركيوس عن عناوين مثل الغاية، الرؤية، الرسالة، القيم، الجمهور المستهدف، الشخصيات، تحليل المنافسين، التموضع، عرض القيمة، والنبرة — بالعربية أو الإنجليزية — ويعرض كل تطابق قبل إضافة أي شيء."
                : "Markyos scans for headings like Purpose, Vision, Mission, Core values, Target audience, Personas, Competitive analysis, Positioning, Unique value proposition and Tone of voice — in Arabic or English — and lets you review every match before anything is added."}
            </p>
            {error && (
              <div
                className="rounded-lg px-3.5 py-2.5 text-[12.5px]"
                style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
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
            {nothingDetected ? (
              <div className="flex flex-col gap-3 py-2">
                <div
                  className="rounded-lg px-3.5 py-3 text-[12.5px] leading-[1.6]"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  {isAr
                    ? `لم يُعثر على أقسام استراتيجية معروفة في ${fileName}.`
                    : `No recognizable strategy sections in ${fileName}.`}
                </div>
                {unmatched.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                      {isAr
                        ? "العناوين التي وُجدت ولم تُعرف — أعد تسمية أحدها ليطابق حقلًا معروفًا:"
                        : "Headings it found but didn't recognise — rename one of these to match a known field:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {unmatched.map((h) => (
                        <span
                          key={h}
                          dir="auto"
                          className="text-[11px] px-2.5 py-1.5 rounded-full"
                          style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => setStep("pick")} className="self-start">
                  {isAr ? "جرّب ملفًا آخر" : "Try another file"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto pe-1 -me-1">
                {singles.map((s, i) => (
                  <label
                    key={s.key}
                    className="rounded-xl p-3.5 flex flex-col gap-2 cursor-pointer"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={s.include}
                        onChange={(e) =>
                          setSingles((prev) => prev.map((r, ri) => (ri === i ? { ...r, include: e.target.checked } : r)))
                        }
                      />
                      <span
                        className="text-[12px] font-semibold uppercase"
                        style={{ letterSpacing: ".06em", color: "var(--text-faint)" }}
                      >
                        {s.label}
                      </span>
                      {s.heading && (
                        <span
                          dir="auto"
                          className="text-[10.5px] truncate"
                          style={{ color: "var(--text-faint)" }}
                          title={s.heading}
                        >
                          ← “{s.heading}”
                        </span>
                      )}
                    </div>
                    <textarea
                      dir="auto"
                      value={s.value}
                      rows={Math.min(5, Math.max(2, Math.ceil(s.value.length / 60)))}
                      onChange={(e) =>
                        setSingles((prev) => prev.map((r, ri) => (ri === i ? { ...r, value: e.target.value } : r)))
                      }
                      className="rounded-lg p-2.5 outline-none text-[13px] resize-none bidi-auto"
                      style={{ background: "var(--surface-1)", color: "var(--text)" }}
                    />
                  </label>
                ))}

                {coreValues.length > 0 && (
                  <Group label={isAr ? "القيم الجوهرية" : "Core values"}>
                    {coreValues.map((v, i) => (
                      <ListRowEditor
                        key={i}
                        row={v}
                        titlePlaceholder="Value"
                        descPlaceholder="What it means in practice"
                        onChange={(next) => setCoreValues((prev) => prev.map((r, ri) => (ri === i ? next : r)))}
                      />
                    ))}
                  </Group>
                )}

                {competitors.length > 0 && (
                  <Group label={isAr ? "المنافسون" : "Competitors"}>
                    {competitors.map((c, i) => (
                      <ListRowEditor
                        key={i}
                        row={c}
                        titlePlaceholder="Competitor name"
                        descPlaceholder="Notes"
                        onChange={(next) => setCompetitors((prev) => prev.map((r, ri) => (ri === i ? next : r)))}
                      />
                    ))}
                  </Group>
                )}

                {personas.length > 0 && (
                  <Group label={isAr ? "الشخصيات" : "Personas"}>
                    {personas.map((p, i) => (
                      <TripleRowEditor
                        key={i}
                        include={p.include}
                        values={[p.name, p.role, p.description]}
                        placeholders={["Name", "Role", "Description"]}
                        onChange={(include, [name, role, description]) =>
                          setPersonas((prev) =>
                            prev.map((r, ri) => (ri === i ? { ...r, include, name, role, description } : r))
                          )
                        }
                      />
                    ))}
                  </Group>
                )}

                {voiceTraits.length > 0 && (
                  <Group label={isAr ? "الشخصية والنبرة" : "Voice & tone"}>
                    {voiceTraits.map((t, i) => (
                      <TripleRowEditor
                        key={i}
                        include={t.include}
                        values={[t.trait, t.doExample, t.dontExample]}
                        placeholders={["Trait", "Do — write it like this", "Don't — not like this"]}
                        onChange={(include, [trait, doExample, dontExample]) =>
                          setVoiceTraits((prev) =>
                            prev.map((r, ri) => (ri === i ? { ...r, include, trait, doExample, dontExample } : r))
                          )
                        }
                      />
                    ))}
                  </Group>
                )}

                {unmatched.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                      {isAr
                        ? `${unmatched.length} عنوانًا آخر في الملف لم يُطابق أي حقل:`
                        : `${unmatched.length} other heading${unmatched.length === 1 ? "" : "s"} in the file matched no field:`}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {unmatched.map((h) => (
                        <span
                          key={h}
                          dir="auto"
                          className="text-[10.5px] px-2 py-1 rounded-full"
                          style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {step === "review" && !nothingDetected && (
          <div className="flex items-center justify-end gap-2.5 shrink-0 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-full text-[13px] font-semibold cursor-pointer"
              style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--hairline)" }}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <Button variant="primary" size="md" onClick={apply} disabled={selectedCount === 0}>
              {isAr ? `استيراد ${selectedCount || ""}` : `Import ${selectedCount || ""} ${selectedCount === 1 ? "item" : "items"}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[12px] font-semibold uppercase px-0.5"
        style={{ letterSpacing: ".06em", color: "var(--text-faint)" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ListRowEditor({
  row,
  titlePlaceholder,
  descPlaceholder,
  onChange,
}: {
  row: ListRow;
  titlePlaceholder: string;
  descPlaceholder: string;
  onChange: (row: ListRow) => void;
}) {
  return (
    <label className="rounded-xl p-3 flex items-start gap-2.5 cursor-pointer" style={{ background: "var(--surface-2)" }}>
      <input
        type="checkbox"
        checked={row.include}
        className="mt-1"
        onChange={(e) => onChange({ ...row, include: e.target.checked })}
      />
      <div className="flex-1 flex flex-col gap-1.5">
        <input
          dir="auto"
          value={row.title}
          placeholder={titlePlaceholder}
          onChange={(e) => onChange({ ...row, title: e.target.value })}
          className="h-8 px-2.5 rounded-md outline-none text-[13px] font-medium bidi-auto"
          style={{ background: "var(--surface-1)", color: "var(--text)" }}
        />
        <input
          dir="auto"
          value={row.description}
          placeholder={descPlaceholder}
          onChange={(e) => onChange({ ...row, description: e.target.value })}
          className="h-8 px-2.5 rounded-md outline-none text-[12px] bidi-auto"
          style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}
        />
      </div>
    </label>
  );
}

/** Personas and voice traits are three fields each, not two. */
function TripleRowEditor({
  include,
  values,
  placeholders,
  onChange,
}: {
  include: boolean;
  values: [string, string, string];
  placeholders: [string, string, string];
  onChange: (include: boolean, values: [string, string, string]) => void;
}) {
  return (
    <label className="rounded-xl p-3 flex items-start gap-2.5 cursor-pointer" style={{ background: "var(--surface-2)" }}>
      <input
        type="checkbox"
        checked={include}
        className="mt-1"
        onChange={(e) => onChange(e.target.checked, values)}
      />
      <div className="flex-1 flex flex-col gap-1.5">
        {values.map((v, i) => (
          <input
            key={i}
            dir="auto"
            value={v}
            placeholder={placeholders[i]}
            onChange={(e) => {
              const next = [...values] as [string, string, string];
              next[i] = e.target.value;
              onChange(include, next);
            }}
            className="h-8 px-2.5 rounded-md outline-none text-[12.5px] bidi-auto"
            style={{
              background: "var(--surface-1)",
              color: i === 0 ? "var(--text)" : "var(--text-secondary)",
              fontWeight: i === 0 ? 500 : 400,
            }}
          />
        ))}
      </div>
    </label>
  );
}
