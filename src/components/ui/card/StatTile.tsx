/** One number and what it counts. */
export function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-2 p-3.5">
      <span className="font-display text-[22px] font-semibold">{value}</span>
      <span className="text-[11px] text-text-faint">{label}</span>
    </div>
  );
}
