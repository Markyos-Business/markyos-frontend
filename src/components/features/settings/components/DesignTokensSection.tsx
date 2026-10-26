"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, Row, Section, useToast } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { triggerBlobDownload } from "@/lib/rasterize";
import type { Workspace } from "@/types";
import { useCopy } from "../hooks/useCopy";
import { diffTokens, parseDesignTokens, serializeTokens } from "../model/designTokens";

/** The palette and type as W3C design tokens: out to Figma and back. */
export function DesignTokensSection({ ws }: { ws: Workspace }) {
  const { addColor, updateColor, setTypography, toggleFigmaSync } = useApp();
  const { showToast } = useToast();
  const copy = useCopy();
  const [syncing, setSyncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function copyTokens() {
    void copy(serializeTokens(ws), "Design tokens");
    toggleFigmaSync(ws.id, true);
  }

  function downloadTokens() {
    triggerBlobDownload(new Blob([serializeTokens(ws)], { type: "application/json" }), `${ws.slug}-tokens.json`);
    toggleFigmaSync(ws.id, true);
    showToast("Tokens exported.", "success");
  }

  async function importTokens(file: File) {
    setSyncing(true);
    try {
      const parsed = parseDesignTokens(await file.text());
      if (!parsed.ok) {
        showToast(parsed.error, "danger");
        return;
      }
      const diff = diffTokens(ws.colors, parsed.tokens.colors);
      for (const c of diff.added) addColor(ws.id, c);
      for (const c of diff.changed) updateColor(ws.id, c.swatch.id, { name: c.swatch.name, hex: c.hex });
      if (parsed.tokens.typography.latinFamily || parsed.tokens.typography.arabicFamily) {
        setTypography(ws.id, parsed.tokens.typography);
      }
      toggleFigmaSync(ws.id, true);

      // Says what actually changed, including when the answer is "nothing" —
      // a silent success on an import is indistinguishable from a failure.
      const parts: string[] = [];
      if (diff.added.length) parts.push(`${diff.added.length} added`);
      if (diff.changed.length) parts.push(`${diff.changed.length} updated`);
      if (diff.unchanged) parts.push(`${diff.unchanged} already matched`);
      showToast(parts.length ? `Tokens imported — ${parts.join(", ")}.` : "Tokens read, but nothing differed.", "success");
    } catch {
      showToast("Couldn't read that file.", "danger");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Section title="Design tokens" icon="shapes">
      <p className="-mt-1 text-[12.5px] leading-[1.6] text-text-muted">
        This workspace&apos;s palette and type, in the W3C Design Tokens format that Figma Variables, Tokens Studio and Style Dictionary all read. Export it into
        your Figma library, edit there, and bring the file back to catch drift in either direction.
      </p>
      <Row
        label="Export tokens"
        hint={
          ws.developer.figmaSyncedAt
            ? `${ws.colors.length} colors + 2 type tokens · last exchanged ${formatRelative(ws.developer.figmaSyncedAt)}.`
            : `${ws.colors.length} colors + 2 type tokens.`
        }
        right={
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={copyTokens}>
              Copy JSON
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTokens}>
              Download
            </Button>
          </div>
        }
      />
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importTokens(file);
          e.target.value = "";
        }}
      />
      <Row
        label="Import tokens"
        hint="Adds colors it doesn't have and updates ones whose hex changed. Nothing is deleted."
        right={
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={syncing}>
            {syncing ? "Reading…" : "Choose file"}
          </Button>
        }
      />
    </Section>
  );
}
