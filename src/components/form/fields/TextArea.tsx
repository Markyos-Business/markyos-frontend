import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** The fill: the opposite of the surface the box sits on. */
  fill?: "surface-1" | "surface-2";
  /** A small caption above the box, for an inspector's stacked fields. */
  label?: string;
};

/** The multi-line partner of `TextInput`: a compact filled box for dense panels. */
export function TextArea({ fill = "surface-1", label, className = "", ...props }: TextAreaProps) {
  const box = (
    <textarea
      {...props}
      className={`resize-none rounded-lg px-3 py-2.5 text-text outline-none ${fill === "surface-1" ? "bg-surface-1" : "bg-surface-2"} ${className || "text-[12px]"}`}
    />
  );
  if (!label) return box;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-text-faint">{label}</span>
      {box}
    </label>
  );
}
