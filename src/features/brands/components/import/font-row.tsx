import { ToggleButton } from "@/components/ui";
import type { DetectedFont } from "../../api/brands.api";

type FontRowProps = { script: "latin" | "arabic"; label: string; fonts: DetectedFont[]; value: string; onChange: (name: string) => void };

/** Which embedded font sets one script; pressing the chosen one clears it. */
export function FontRow({ script, label, fonts, value, onChange }: FontRowProps) {
  return (
    <div className="flex items-start gap-ctl-row">
      <span className="w-[54px] shrink-0 pt-1.5 text-caption font-medium text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-ctl-row">
        {fonts.map((f) => {
          const on = value === f.name;
          const chars = script === "arabic" ? f.arabicChars : f.latinChars;
          return (
            <ToggleButton
              key={f.name}
              size="sm"
              pressed={on}
              onClick={() => onChange(on ? "" : f.name)}
              title={`${f.arabicChars} Arabic / ${f.latinChars} Latin characters set in this font`}
            >
              {f.name}
              {chars > 0 && <span className="opacity-60"> · {chars}</span>}
            </ToggleButton>
          );
        })}
      </div>
    </div>
  );
}
