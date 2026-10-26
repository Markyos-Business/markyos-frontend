"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/components/ui";
import { analyzeBrandDocument, nameFromFileName, strategyFieldCount, suggestedColors, type DocumentAnalysis } from "../services/brandImport";

type ImportStage = "idle" | "extracting" | "review";

/** Reading a guideline file, reviewing what it holds, and creating a brand from the parts kept. */
export function useBrandImport() {
  const { createWorkspace, addColor, setTypography, setStrategyText, addCoreValue, addCompetitor, addPersona, addVoiceTrait } = useApp();
  const { showToast } = useToast();
  const router = useRouter();
  const [stage, setStage] = useState<ImportStage>("idle");
  const [progress, setProgress] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [importName, setImportName] = useState("");
  const [pickedColors, setPickedColors] = useState<Set<string>>(new Set());
  const [latinFont, setLatinFont] = useState<string>("");
  const [arabicFont, setArabicFont] = useState<string>("");

  async function start(file: File) {
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

  function confirm() {
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
    showToast(`Imported ${pickedColors.size} colors and ${found} strategy ${found === 1 ? "field" : "fields"} — review each before sharing.`, "success");
    router.push(`/w/${ws.slug}/overview`);
  }

  function reset() {
    setStage("idle");
    setAnalysis(null);
    setPickedColors(new Set());
    setLatinFont("");
    setArabicFont("");
  }

  function toggleColor(hex: string) {
    setPickedColors((prev) => {
      const next = new Set(prev);
      if (next.has(hex)) next.delete(hex);
      else next.add(hex);
      return next;
    });
  }

  return {
    stage,
    fileName,
    progress,
    onFile: (file: File) => void start(file),
    review: analysis && {
      analysis,
      importName,
      onName: setImportName,
      pickedColors,
      onToggleColor: toggleColor,
      latinFont,
      arabicFont,
      onLatinFont: setLatinFont,
      onArabicFont: setArabicFont,
      onReset: reset,
      onConfirm: confirm,
    },
  };
}

export type BrandImportState = ReturnType<typeof useBrandImport>;
export type ImportReviewProps = NonNullable<BrandImportState["review"]>;
