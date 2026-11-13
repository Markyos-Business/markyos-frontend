type SkeletonProps = {
  /** Size and shape, e.g. "h-4 w-full rounded-lg". */
  className?: string;
};

/**
 * A placeholder shaped like the content it stands in for, with a soft light
 * crossing it so it reads as loading rather than empty. Under reduced motion
 * the light stays put.
 */
const Skeleton = ({ className = "h-4 w-full rounded-lg" }: SkeletonProps) => (
  <div
    aria-hidden
    className={`relative overflow-hidden bg-surface-2 after:absolute after:inset-0 after:animate-shimmer after:bg-shimmer ${className}`}
  />
);

export { Skeleton };
export type { SkeletonProps };
