import type { ReactNode } from "react";

type KeyValueItem = { label: string; value: ReactNode };

type KeyValueListProps = {
  items: KeyValueItem[];
  /** `rows` stacks label and value side by side; `grid` puts them in two columns from tablet up. Default `rows`. */
  layout?: "rows" | "grid";
  className?: string;
};

/** Facts about one thing, label then value: the body of a detail panel. */
const KeyValueList = ({ items, layout = "rows", className = "" }: KeyValueListProps) => (
  <dl className={layout === "grid" ? `grid grid-cols-1 gap-x-space-10 gap-y-space-5 sm:grid-cols-2 ${className}` : `flex flex-col ${className}`}>
    {items.map((item) => (
      <div
        key={item.label}
        className={
          layout === "grid"
            ? "flex flex-col gap-space-1"
            : "flex items-center justify-between gap-space-6 py-space-4 shadow-rule-t first:shadow-none"
        }
      >
        <dt className="text-caption text-text-muted">{item.label}</dt>
        <dd dir="auto" className="bidi-auto min-w-0 text-body font-medium text-text">
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
);

export { KeyValueList };
export type { KeyValueItem, KeyValueListProps };
