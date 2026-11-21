import type { ReactNode } from "react";

type Columns = 1 | 2 | 3;

const COLUMNS: Record<Columns, string> = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" };
const SPANS = { 1: "", 2: "sm:col-span-2", 3: "sm:col-span-2 lg:col-span-3", full: "col-span-full" } as const;

type FormGridProps = {
  columns?: Columns;
  /** `compact` for dense panels (inspectors, cards, table rows): 8px between fields instead of 18. */
  density?: "default" | "compact";
  className?: string;
  children: ReactNode;
};
type FormGridItemProps = { span?: keyof typeof SPANS; className?: string; children: ReactNode };

/** One field across more than one column: a description, an address line. */
const FormGridItem = ({ span = 1, className = "", children }: FormGridItemProps) => <div className={`min-w-0 ${SPANS[span]} ${className}`}>{children}</div>;

/**
 * Fields in 1, 2 or 3 columns, one under another below 640px (three come
 * down to two before one). The spacing is the Fieldset's, so a grid and a
 * fieldset in one form line up. `FormGrid.Item span` widens one field.
 */
const Grid = ({ columns = 2, density = "default", className = "", children }: FormGridProps) => (
  <div className={`grid grid-cols-1 gap-x-form-col ${density === "compact" ? "gap-y-field-stack-compact" : "gap-y-field-stack"} ${COLUMNS[columns]} ${className}`}>{children}</div>
);

const FormGrid = Object.assign(Grid, { Item: FormGridItem });

export { FormGrid, FormGridItem };
export type { FormGridItemProps, FormGridProps };
