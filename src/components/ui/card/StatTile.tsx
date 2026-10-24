type StatTileProps = {
  value: number | string;
  label: string;
};

/** One number and what it counts. */
const StatTile = ({ value, label }: StatTileProps) => (
  // A counter (spec §6.14): the value large at weight 500 over a 12px label,
  // on the sunken fill with the widget radius.
  <div className="flex flex-col gap-space-1 rounded-widget bg-surface-sunken p-space-6 shadow-edge-soft">
    <span className="text-h2 font-medium text-text">{value}</span>
    <span className="text-caption text-text-muted">{label}</span>
  </div>
);

export { StatTile };
export type { StatTileProps };
