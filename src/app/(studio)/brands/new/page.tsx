"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast, Button, TextField, PillButton, Icon, Tabs } from "@/components/ui";
import { slugify } from "@/lib/utils";
import {
  DetectedFont,
  DocumentAnalysis,
  analyzeBrandDocument,
  nameFromFileName,
  strategyFieldCount,
  suggestedColors,
} from "@/components/features/brands";
import { ParsedStrategy } from "@/lib/docParse";

type Mode = "scratch" | "import";
type ImportStage = "idle" | "extracting" | "review";

const STRATEGY_LABELS: { key: keyof ParsedStrategy; label: string }[] = [
  { key: "purpose", label: "Purpose" },
  { key: "vision", label: "Vision" },
  { key: "mission", label: "Mission" },
  { key: "coreValues", label: "Core values" },
  { key: "targetAudienceSummary", label: "Target audience" },
  { key: "competitors", label: "Competitive analysis" },
  { key: "positioningStatement", label: "Brand positioning" },
  { key: "uvp", label: "Unique value proposition" },
  { key: "personas", label: "Personas" },
  { key: "voiceTraits", label: "Voice & tone" },
];

export default function NewWorkspacePage() {
  const {
    state,
    hydrated,
    logout,
    createWorkspace,
    addColor,
    setTypography,
    setStrategyText,
    addCoreValue,
    addCompetitor,
    addPersona,
    addVoiceTrait,
  } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scratch");
  const [name, setName] = useState("");

  const [stage, setStage] = useState<ImportStage>("idle");
  const [progress, setProgress] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [importName, setImportName] = useState("");
  const [pickedColors, setPickedColors] = useState<Set<string>>(new Set());
  const [latinFont, setLatinFont] = useState<string>("");
  const [arabicFont, setArabicFont] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated && !state.session) router.replace("/login");
  }, [hydrated, state.session, router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const ws = createWorkspace(trimmed);
    router.push(`/w/${ws.slug}/overview`);
  }

  async function startImport(file: File) {
    setFileName(file.name);
    setProgress("Opening the document…");
    setStage("extracting");
    setAnalysis(null);
    try {
      const result = await analyzeBrandDocument(file, setProgress);
      setAnalysis(result);
      setImportName(nameFromFileName(file.name) || "Imported Brand");
      // Pre-select the colours that read as brand colours rather than page
      // furniture — anything the studio disagrees with is one click away.
      setPickedColors(new Set(suggestedColors(result.colors).map((c) => c.hex)));
      setLatinFont(result.fonts.find((f) => f.script === "latin")?.name ?? "");
      setArabicFont(result.fonts.find((f) => f.script === "arabic")?.name ?? "");
      setStage("review");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't read that file.", "danger");
      setStage("idle");
    }
  }

  function confirmImport() {
    if (!analysis) return;
    const ws = createWorkspace(importName.trim() || "Imported Brand");

    for (const c of analysis.colors) {
      if (pickedColors.has(c.hex)) addColor(ws.id, { name: c.name, hex: c.hex });
    }
    if (latinFont || arabicFont) {
      setTypography(ws.id, {
        ...(latinFont ? { latinFamily: latinFont } : {}),
        ...(arabicFont ? { arabicFamily: arabicFont } : {}),
      });
    }

    const s = analysis.strategy;
    for (const field of ["purpose", "vision", "mission", "targetAudienceSummary", "positioningStatement", "uvp"] as const) {
      const value = s[field];
      if (value) setStrategyText(ws.id, field, value);
    }
    for (const v of s.coreValues ?? []) addCoreValue(ws.id, { title: v.title, description: v.description });
    for (const c of s.competitors ?? []) addCompetitor(ws.id, { name: c.title, notes: c.description });
    for (const p of s.personas ?? []) addPersona(ws.id, { name: p.name, role: p.role, description: p.description });
    for (const t of s.voiceTraits ?? []) {
      addVoiceTrait(ws.id, { trait: t.trait, doExample: t.doExample, dontExample: t.dontExample });
    }

    const found = strategyFieldCount(s);
    showToast(
      `Imported ${pickedColors.size} colors and ${found} strategy ${found === 1 ? "field" : "fields"} — review each before sharing.`,
      "success"
    );
    router.push(`/w/${ws.slug}/overview`);
  }

  function resetImport() {
    setStage("idle");
    setAnalysis(null);
    setPickedColors(new Set());
    setLatinFont("");
    setArabicFont("");
  }

  if (!hydrated || !state.session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 shrink-0 flex items-center justify-between px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/markyos-mark.svg" alt="Markyos" style={{ height: 20, filter: "var(--chrome-mark-invert)" }} />
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="mk-tap text-caption cursor-pointer"
          style={{ color: "var(--text-faint)" }}
        >
          Log out
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-[72px] max-w-[680px] w-full mx-auto py-10">
        <Tabs
          label="How to start"
          className="mb-space-10 self-start"
          tabs={[
            { key: "scratch", label: "Start from scratch" },
            { key: "import", label: "Import a guideline" },
          ]}
          active={mode}
          onChange={setMode}
        />

        {mode === "scratch" ? (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <h1 className="text-h1 font-medium mb-space-3">
              Name your brand
            </h1>
            <p className="mb-[26px] text-body" style={{ color: "var(--text-muted)" }}>
              One workspace per brand. You can rename it later.
            </p>
            <div className="mb-[26px]">
              <TextField
                // The <h1> asks for it, but a heading is not a label — this is
                // the only field on the screen and it still needs a name.
                aria-label="Brand name"
                placeholder="Nadeen Studio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                hint={`markyos.com/${slugify(name || "your-brand")}`}
              />
            </div>
            <PillButton type="submit" variant="primary" disabled={!name.trim()}>
              Create workspace
            </PillButton>
          </form>
        ) : stage === "idle" ? (
          <div className="flex flex-col">
            <h1 className="text-h1 font-medium mb-space-3">
              Import an existing guideline
            </h1>
            <p className="mb-[26px] text-body max-w-[54ch]" style={{ color: "var(--text-muted)" }}>
              Upload the PDF or Word file you already have. Markyos renders the pages and samples
              their colours, reads the fonts the file embeds, and matches any strategy headings it
              can find — then shows you everything it found before anything is saved.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) startImport(file);
                e.target.value = "";
              }}
            />
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) startImport(file);
              }}
              className="rounded-card h-50 flex flex-col items-center justify-center gap-3 cursor-pointer"
              style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--hairline-strong)" }}
            >
              <Icon name="upload" size={26} style={{ color: "var(--text-muted)" }} />
              <span className="text-body font-medium">Drop a PDF or .docx, or click to browse</span>
              <span className="text-caption" style={{ color: "var(--text-faint)" }}>
                Read entirely in your browser — the file is never uploaded anywhere
              </span>
            </div>
          </div>
        ) : stage === "extracting" ? (
          <div className="flex flex-col items-center text-center gap-5 py-10">
            <div className="size-control rounded-lg grid place-items-center" style={{ background: "var(--accent-soft)" }}>
              <Icon name="circle-notch" size={22} style={{ color: "var(--accent-text)" }} className="animate-spin" />
            </div>
            <div>
              <div className="font-medium text-h5 mb-1">{fileName}</div>
              <div className="text-body" style={{ color: "var(--text-muted)" }}>
                {progress}
              </div>
            </div>
          </div>
        ) : analysis ? (
          <ReviewPanel
            analysis={analysis}
            importName={importName}
            onName={setImportName}
            pickedColors={pickedColors}
            onToggleColor={(hex) =>
              setPickedColors((prev) => {
                const next = new Set(prev);
                if (next.has(hex)) next.delete(hex);
                else next.add(hex);
                return next;
              })
            }
            latinFont={latinFont}
            arabicFont={arabicFont}
            onLatinFont={setLatinFont}
            onArabicFont={setArabicFont}
            onReset={resetImport}
            onConfirm={confirmImport}
          />
        ) : null}
      </div>

      <div className="px-[72px] pb-10 text-caption" style={{ color: "var(--text-faint)" }}>
        Arabic and English are both on by default.
      </div>
    </div>
  );
}

function ReviewPanel({
  analysis,
  importName,
  onName,
  pickedColors,
  onToggleColor,
  latinFont,
  arabicFont,
  onLatinFont,
  onArabicFont,
  onReset,
  onConfirm,
}: {
  analysis: DocumentAnalysis;
  importName: string;
  onName: (v: string) => void;
  pickedColors: Set<string>;
  onToggleColor: (hex: string) => void;
  latinFont: string;
  arabicFont: string;
  onLatinFont: (v: string) => void;
  onArabicFont: (v: string) => void;
  onReset: () => void;
  onConfirm: () => void;
}) {
  const found = strategyFieldCount(analysis.strategy);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-h2 font-medium mb-space-2">
          Here&apos;s what&apos;s actually in the file
        </h1>
        <p className="text-body" style={{ color: "var(--text-muted)" }}>
          {analysis.fileName}
          {analysis.pageCount > 0 && ` · ${analysis.pageCount} pages, ${analysis.pagesRendered} sampled for colour`}.
          Nothing is saved until you confirm.
        </p>
      </div>

      {analysis.notes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {analysis.notes.map((n, i) => (
            <div key={i} className="flex items-start gap-2.5 text-caption" style={{ color: "var(--text-faint)" }}>
              <Icon name="info-circle" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {n}
            </div>
          ))}
        </div>
      )}

      <TextField label="Brand name" value={importName} onChange={(e) => onName(e.target.value)} />

      <Group
        title={`Colours measured from the pages (${analysis.colors.length})`}
        hint="Sampled from the rendered pixels, with the share of the page each covers. Tap to include or drop."
      >
        {analysis.colors.length === 0 ? (
          <Blank>No colour covered enough of a page to read as a brand colour.</Blank>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {analysis.colors.map((c) => {
              const on = pickedColors.has(c.hex);
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onToggleColor(c.hex)}
                  className="rounded-lg overflow-hidden cursor-pointer text-start"
                  style={{
                    background: "var(--surface-2)",
                    boxShadow: on ? "inset 0 0 0 2px var(--accent)" : "inset 0 0 0 1px var(--hairline)",
                    opacity: on ? 1 : 0.5,
                  }}
                >
                  <div className="h-10" style={{ background: c.hex }} />
                  <div className="px-2 py-1.5">
                    <div className="text-caption font-medium truncate">{c.name}</div>
                    <div
                      className="text-caption"
                      style={{ fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-faint)" }}
                    >
                      {c.hex.toUpperCase()} · {(c.share * 100).toFixed(0)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Group>

      <Group
        title={`Fonts the file embeds (${analysis.fonts.length})`}
        hint="Which script each one sets is counted from the characters it was actually used for, not guessed from its name."
      >
        {analysis.fonts.length === 0 ? (
          <Blank>This file declares no embedded fonts.</Blank>
        ) : (
          <div className="flex flex-col gap-3">
            <FontRow
              label="Latin"
              fonts={analysis.fonts}
              value={latinFont}
              onChange={onLatinFont}
            />
            <FontRow
              label="Arabic"
              fonts={analysis.fonts}
              value={arabicFont}
              onChange={onArabicFont}
            />
          </div>
        )}
      </Group>

      <Group
        title={`Strategy headings matched (${found} of ${STRATEGY_LABELS.length})`}
        hint="Only headings that literally appear in the document. A field nothing was found for stays empty rather than being filled with a guess."
      >
        <div className="flex flex-wrap gap-1.5">
          {STRATEGY_LABELS.map(({ key, label }) => {
            const value = analysis.strategy[key];
            const has = Array.isArray(value) ? value.length > 0 : !!value;
            return (
              <span
                key={key}
                className="text-caption px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                style={{
                  background: has ? "rgba(124,231,172,.12)" : "var(--surface-2)",
                  color: has ? "var(--success)" : "var(--text-faint)",
                }}
                title={typeof value === "string" ? value.slice(0, 200) : undefined}
              >
                <Icon name={has ? "check" : "times"} size={11} />
                {label}
                {Array.isArray(value) && value.length > 0 && ` · ${value.length}`}
              </span>
            );
          })}
        </div>
      </Group>

      <div className="flex gap-2.5 mt-1">
        <Button variant="outline" onClick={onReset}>
          Start over
        </Button>
        <PillButton variant="primary" onClick={onConfirm}>
          Create workspace from this
        </PillButton>
      </div>
    </div>
  );
}

function FontRow({
  label,
  fonts,
  value,
  onChange,
}: {
  label: string;
  fonts: DetectedFont[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-caption font-medium w-[54px] shrink-0 pt-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {fonts.map((f) => {
          const on = value === f.name;
          const chars = label === "Arabic" ? f.arabicChars : f.latinChars;
          return (
            <button
              key={f.name}
              type="button"
              onClick={() => onChange(on ? "" : f.name)}
              className="text-caption px-2.5 py-1.5 rounded-lg cursor-pointer"
              style={{
                fontFamily: "ui-monospace, Menlo, monospace",
                background: on ? "var(--accent-soft)" : "var(--surface-2)",
                color: on ? "var(--accent)" : "var(--text-muted)",
              }}
              title={`${f.arabicChars} Arabic / ${f.latinChars} Latin characters set in this font`}
            >
              {f.name}
              {chars > 0 && <span style={{ opacity: 0.6 }}> · {chars}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption font-medium">{title}</span>
      <p className="text-caption max-w-[62ch]" style={{ color: "var(--text-faint)" }}>
        {hint}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Blank({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg px-space-6 py-space-5 text-caption"
      style={{ background: "var(--surface-1)", color: "var(--text-faint)" }}
    >
      {children}
    </div>
  );
}
