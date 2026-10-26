import { Button, Icon } from "@/components/ui";
import { InputField } from "@/components/form";
import { STRATEGY_LABELS } from "../../constants";
import type { ImportReviewProps } from "../../hooks/useBrandImport";
import { strategyFieldCount } from "../../services/brandImport";
import { FontRow } from "./FontRow";
import { ImportBlank, ImportGroup } from "./ImportGroup";

/** Everything read from the file, to keep or drop before the brand is created. */
export function ImportReview({
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
}: ImportReviewProps) {
  const found = strategyFieldCount(analysis.strategy);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="mb-space-2 text-h2 font-medium">Here&apos;s what&apos;s actually in the file</h1>
        <p className="text-body text-text-muted">
          {analysis.fileName}
          {analysis.pageCount > 0 && ` · ${analysis.pageCount} pages, ${analysis.pagesRendered} sampled for colour`}. Nothing is saved until you confirm.
        </p>
      </div>

      {analysis.notes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {analysis.notes.map((n, i) => (
            <div key={i} className="flex items-start gap-2.5 text-caption text-text-faint">
              <Icon name="info-circle" size={14} className="mt-px shrink-0" />
              {n}
            </div>
          ))}
        </div>
      )}

      <InputField label="Brand name" value={importName} onChange={(e) => onName(e.target.value)} />

      <ImportGroup
        title={`Colours measured from the pages (${analysis.colors.length})`}
        hint="Sampled from the rendered pixels, with the share of the page each covers. Tap to include or drop."
      >
        {analysis.colors.length === 0 ? (
          <ImportBlank>No colour covered enough of a page to read as a brand colour.</ImportBlank>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {analysis.colors.map((c) => {
              const on = pickedColors.has(c.hex);
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onToggleColor(c.hex)}
                  className={`cursor-pointer overflow-hidden rounded-lg bg-surface-2 text-start ${
                    on ? "shadow-[inset_0_0_0_2px_var(--accent)]" : "opacity-50 shadow-edge-soft"
                  }`}
                >
                  {/* The measured colour is data, so it stays inline. */}
                  <div className="h-10" style={{ background: c.hex }} />
                  <div className="px-2 py-1.5">
                    <div className="truncate text-caption font-medium">{c.name}</div>
                    <div className="font-mono text-caption text-text-faint">
                      {c.hex.toUpperCase()} · {(c.share * 100).toFixed(0)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ImportGroup>

      <ImportGroup
        title={`Fonts the file embeds (${analysis.fonts.length})`}
        hint="Which script each one sets is counted from the characters it was actually used for, not guessed from its name."
      >
        {analysis.fonts.length === 0 ? (
          <ImportBlank>This file declares no embedded fonts.</ImportBlank>
        ) : (
          <div className="flex flex-col gap-3">
            <FontRow label="Latin" fonts={analysis.fonts} value={latinFont} onChange={onLatinFont} />
            <FontRow label="Arabic" fonts={analysis.fonts} value={arabicFont} onChange={onArabicFont} />
          </div>
        )}
      </ImportGroup>

      <ImportGroup
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
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-caption ${has ? "bg-success-soft text-success" : "bg-surface-2 text-text-faint"}`}
                title={typeof value === "string" ? value.slice(0, 200) : undefined}
              >
                <Icon name={has ? "check" : "times"} size={11} />
                {label}
                {Array.isArray(value) && value.length > 0 && ` · ${value.length}`}
              </span>
            );
          })}
        </div>
      </ImportGroup>

      <div className="mt-1 flex gap-2.5">
        <Button variant="outline" onClick={onReset}>
          Start over
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Create workspace from this
        </Button>
      </div>
    </div>
  );
}
