import { SurfaceCard } from "../card/surface-card";
import { Field } from "../field/field";
import { Skeleton } from "../skeleton";
import { FormGrid } from "./form-grid";

type FormSkeletonProps = {
  /** Sections, each a title and its fields. Default 2. */
  sections?: number;
  /** Fields per section. Default 4. */
  fields?: number;
  columns?: 1 | 2 | 3;
  /** Match FormSection's variant. Default plain. */
  variant?: "plain" | "card";
  /** Show the actions row at the end. Default true. */
  actions?: boolean;
  /** For screen readers. Default "Loading". */
  label?: string;
};

/**
 * A form's shape while it loads: section titles, fields in their grid (each
 * Field's own loading skeleton, so heights match) and the actions row, so
 * nothing jumps when the data arrives. One busy region, named.
 */
const FormSkeleton = ({ sections = 2, fields = 4, columns = 2, variant = "plain", actions = true, label = "Loading" }: FormSkeletonProps) => {
  const section = (i: number) => {
    const body = (
      <>
        <div className="flex flex-col gap-space-2">
          <Skeleton className="h-4 w-40 rounded-sm" />
          <Skeleton className="h-3 w-64 max-w-full rounded-sm" />
        </div>
        <FormGrid columns={columns}>
          {Array.from({ length: fields }, (_, j) => (
            <Field key={j} label="·" loading>
              {() => null}
            </Field>
          ))}
        </FormGrid>
      </>
    );
    return variant === "card" ? (
      <SurfaceCard key={i} className="flex flex-col gap-space-6">
        {body}
      </SurfaceCard>
    ) : (
      <div key={i} className="flex flex-col gap-space-6">
        {body}
      </div>
    );
  };
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-space-8">
      {Array.from({ length: sections }, (_, i) => section(i))}
      {actions && (
        <div className="flex justify-end gap-space-3">
          <Skeleton className="h-control w-32 rounded-lg" />
          <Skeleton className="h-control w-24 rounded-lg" />
        </div>
      )}
    </div>
  );
};

export { FormSkeleton };
export type { FormSkeletonProps };
