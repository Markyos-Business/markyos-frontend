export function Avatar({
  initials,
  size = 30,
  tone = "muted",
}: {
  initials: string;
  size?: number;
  tone?: "muted" | "accent";
}) {
  return (
    <div
      className="rounded-full grid place-items-center font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: tone === "accent" ? "var(--accent)" : "var(--surface-2)",
        color: tone === "accent" ? "var(--accent-ink)" : "var(--text-muted)",
        fontSize: Math.max(10, Math.round(size * 0.36)),
      }}
    >
      {initials}
    </div>
  );
}
