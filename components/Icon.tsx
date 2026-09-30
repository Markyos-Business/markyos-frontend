const BRAND_ICONS = new Set(["google"]);

export function Icon({
  name,
  size = 16,
  className = "",
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const prefix = BRAND_ICONS.has(name) ? "lab" : "las";
  return (
    <i
      className={`${prefix} la-${name} ${className}`}
      style={{ fontSize: size, ...style }}
      aria-hidden="true"
    />
  );
}
