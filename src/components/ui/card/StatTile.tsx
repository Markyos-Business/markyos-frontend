type StatTileProps = {
  value: number | string;
  label: string;
};

/** One number and what it counts. */
const StatTile = ({ value, label }: StatTileProps) => (
  <div className="flex flex-col gap-1 rounded-xl bg-surface-2 p-3.5">
    <span className="font-display text-title font-semibold">{value}</span>
    <span className="text-ui-2xs text-text-faint">{label}</span>
  </div>
);

export { StatTile };
export type { StatTileProps };
