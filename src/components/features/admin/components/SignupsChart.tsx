import type { AdminStats } from "../types";

/** New accounts per day, as bars. Each bar names its day and count on hover. */
export function SignupsChart({ signups }: { signups: AdminStats["signups"] }) {
  const max = Math.max(1, ...signups.map((d) => d.count));
  const total = signups.reduce((n, d) => n + d.count, 0);
  const label = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });

  return (
    <section className="mk-surface flex flex-col gap-4 rounded-2xl bg-surface-1 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Signups</h2>
        <span className="text-[12px] text-text-faint">
          {total} in the last {signups.length} days
        </span>
      </div>
      <div
        role="img"
        aria-label={`${total} signups in the last ${signups.length} days`}
        className="flex h-[140px] items-end gap-[3px]"
      >
        {signups.map((d) => (
          <div
            key={d.date}
            title={`${label(d.date)}: ${d.count}`}
            className={`flex-1 rounded-t-[3px] ${d.count ? "bg-accent" : "bg-surface-3"}`}
            style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      {signups.length > 0 && (
        <div className="flex justify-between text-[11px] text-text-faint">
          <span>{label(signups[0].date)}</span>
          <span>{label(signups[signups.length - 1].date)}</span>
        </div>
      )}
    </section>
  );
}
