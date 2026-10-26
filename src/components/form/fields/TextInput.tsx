import type { InputHTMLAttributes } from "react";

type TextInputFill = "surface-1" | "surface-2";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** The fill: the opposite of the surface the input sits on, so it reads as a field. */
  fill?: TextInputFill;
};

const fills: Record<TextInputFill, string> = {
  "surface-1": "bg-surface-1",
  "surface-2": "bg-surface-2",
};

/**
 * A compact filled text box, 40px, for one-line entries inside dense panels
 * (an invite row, a proposal, a value list). Forms use `InputField`, the
 * spec's underlined field; this is the inline shape built before it.
 */
export function TextInput({ fill = "surface-2", className = "", ...props }: TextInputProps) {
  return <input {...props} className={`h-10 rounded-lg px-3 text-[13px] text-text outline-none ${fills[fill]} ${className}`} />;
}
