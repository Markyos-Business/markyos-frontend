import type { CSSProperties } from "react";

// Glyphs that live in the brand set rather than the solid one.
const BRAND_ICONS = new Set(["google"]);

type IconProps = {
  /** A name from the icon set (tailwind/icons.js). */
  name: string;
  /** In pixels; the glyph scales with font size. */
  size?: number;
  className?: string;
  style?: CSSProperties;
};

const Icon = ({ name, size = 16, className = "", style }: IconProps) => {
  const prefix = BRAND_ICONS.has(name) ? "lab" : "las";
  return <i className={`${prefix} la-${name} ${className}`} style={{ fontSize: size, ...style }} aria-hidden="true" />;
};

export { Icon };
export type { IconProps };
