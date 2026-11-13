"use client";

import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button, CopyButton, Row, Section, useToast } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { triggerBlobDownload } from "@/lib/rasterize";
import type { Workspace } from "@/types";
import { diffTokens, parseDesignTokens, serializeTokens } from "../../utils/design-tokens";

/** The palette and type as W3C design tokens: out to Figma and back. */
export function DesignTokensSection({ ws, isAr }: { ws: Workspace; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const { addColor, updateColor, setTypography, toggleFigmaSync } = useApp();
  const { showToast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTokens() {
    triggerBlobDownload(new Blob([serializeTokens(ws)], { type: "application/json" }), `${ws.slug}-tokens.json`);
    toggleFigmaSync(ws.id, true);
    showToast(t("Tokens exported.", "صُدّرت الرموز."), "success");
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
      if (diff.added.length) parts.push(isAr ? `أُضيف ${diff.added.length}` : `${diff.added.length} added`);
      if (diff.changed.length) parts.push(isAr ? `حُدّث ${diff.changed.length}` : `${diff.changed.length} updated`);
      if (diff.unchanged) parts.push(isAr ? `${diff.unchanged} مطابق مسبقًا` : `${diff.unchanged} already matched`);
      showToast(
        parts.length ? (isAr ? `استُوردت الرموز: ${parts.join("، ")}.` : `Tokens imported — ${parts.join(", ")}.`) : t("Tokens read, but nothing differed.", "قُرئت الرموز، ولا يوجد اختلاف."),
        "success"
      );
    } catch {
      showToast(t("Couldn't read that file.", "تعذّرت قراءة الملف."), "danger");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Section title={t("Design tokens", "رموز التصميم")} icon="shapes">
      <p className="-mt-1 text-[12.5px] leading-[1.6] text-text-muted">
        {t(
          "This workspace's palette and type, in the W3C Design Tokens format that Figma Variables, Tokens Studio and Style Dictionary all read. Export it into your Figma library, edit there, and bring the file back to catch drift in either direction.",
          "ألوان هذه المساحة وخطوطها بصيغة W3C Design Tokens التي يقرأها Figma Variables وTokens Studio وStyle Dictionary. صدّرها إلى مكتبة Figma، وعدّل هناك، ثم أعد الملف لاكتشاف أي اختلاف في الاتجاهين."
        )}
      </p>
      <Row
        label={t("Export tokens", "تصدير الرموز")}
        hint={
          ws.developer.figmaSyncedAt
            ? isAr
              ? `${ws.colors.length} ألوان + رمزا خط · آخر تبادل ${formatRelative(ws.developer.figmaSyncedAt)}.`
              : `${ws.colors.length} colors + 2 type tokens · last exchanged ${formatRelative(ws.developer.figmaSyncedAt)}.`
            : isAr
              ? `${ws.colors.length} ألوان + رمزا خط.`
              : `${ws.colors.length} colors + 2 type tokens.`
        }
        right={
          <div className="flex shrink-0 gap-2">
            <CopyButton
              size="sm"
              text={serializeTokens(ws)}
              label={t("Copy JSON", "نسخ JSON")}
              copiedLabel={t("Copied", "تم النسخ")}
              copiedMessage={t("Design tokens copied.", "تم نسخ رموز التصميم.")}
              onCopied={() => toggleFigmaSync(ws.id, true)}
              failedMessage={t("Couldn't copy. Select it and copy it by hand.", "تعذّر النسخ. حدّده وانسخه يدويًا.")}
            />
            <Button variant="outline" size="sm" onClick={downloadTokens}>
              {t("Download", "تنزيل")}
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
        label={t("Import tokens", "استيراد الرموز")}
        hint={t("Adds colors it doesn't have and updates ones whose hex changed. Nothing is deleted.", "يضيف الألوان غير الموجودة ويحدّث التي تغيّر كودها. لا يُحذف شيء.")}
        right={
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={syncing}>
            {syncing ? t("Reading…", "جارٍ القراءة…") : t("Choose file", "اختر ملفًا")}
          </Button>
        }
      />
    </Section>
  );
}
