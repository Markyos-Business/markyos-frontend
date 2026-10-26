import type { DetectedFont } from "../../services/brandImport";

type FontRowProps = { label: "Latin" | "Arabic"; fonts: DetectedFont[]; value: string; onChange: (name: string) => void };

/** Which embedded font sets one script; pressing the chosen one clears it. */
export function FontRow({ label, fonts, value, onChange }: FontRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-[54px] shrink-0 pt-1.5 text-caption font-medium text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {fonts.map((f) => {
          const on = value === f.name;
          const chars = label === "Arabic" ? f.arabicChars : f.latinChars;
          return (
            <button
              key={f.name}
              type="button"
              onClick={() => onChange(on ? "" : f.name)}
              className={`cursor-pointer rounded-lg px-2.5 py-1.5 font-mono text-caption ${on ? "bg-accent-soft text-accent" : "bg-surface-2 text-text-muted"}`}
              title={`${f.arabicChars} Arabic / ${f.latinChars} Latin characters set in this font`}
            >
              {f.name}
              {chars > 0 && <span className="opacity-60"> · {chars}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
