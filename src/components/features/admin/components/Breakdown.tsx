/** A labelled count per category, with a meter against the largest. */
export function Breakdown({
  title,
  counts,
  labels,
  order,
}: {
  title: string;
  counts: Record<string, number>;
  labels: Record<string, string>;
  /** Categories listed first, in this order; the rest follow by size. */
  order?: string[];
}) {
  const keys = Object.keys(counts).sort((a, b) => {
    const ia = order?.indexOf(a) ?? -1;
    const ib = order?.indexOf(b) ?? -1;
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return counts[b] - counts[a];
  });
  const max = Math.max(1, ...Object.values(counts));

  return (
    <section className="mk-surface flex flex-col gap-3.5 rounded-2xl bg-surface-1 p-5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {keys.length === 0 ? (
        <p className="text-[12px] text-text-faint">Nothing yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {keys.map((k) => (
            <li key={k} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12.5px]">
                <span className="text-text-secondary">{labels[k] ?? k}</span>
                <span className="font-semibold tabular-nums">{counts[k]}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(counts[k] / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
