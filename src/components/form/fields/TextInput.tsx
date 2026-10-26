import type { InputHTMLAttributes } from "react";

type TextInputFill = "surface-1" | "surface-2";
type TextInputSize = "sm" | "md";

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** The fill: the opposite of the surface the input sits on, so it reads as a field. */
  fill?: TextInputFill;
  /** `md` is 40px with a 13px value; `sm` is 36px with 12px, for a secondary note. */
  size?: TextInputSize;
};

const sizes: Record<TextInputSize, string> = {
  sm: "h-9 text-[12px]",
  md: "h-10 text-[13px]",
};

const fills: Record<TextInputFill, string> = {
  "surface-1": "bg-surface-1",
  "surface-2": "bg-surface-2",
};

/**
 * A compact filled text box for one-line entries inside dense panels
 * (an invite row, a proposal, a value list). Forms use `InputField`, the
 * spec's underlined field; this is the inline shape built before it.
 */
export function TextInput({ fill = "surface-2", size = "md", className = "", ...props }: TextInputProps) {
  return <input {...props} className={`rounded-lg px-3 text-text outline-none ${sizes[size]} ${fills[fill]} ${className}`} />;
}
