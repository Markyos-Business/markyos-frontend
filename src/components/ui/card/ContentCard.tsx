import type { ReactNode } from "react";

type ContentCardProps = {
  title?: string;
  /** Beside the title: a chart's legend, a count. */
  legend?: ReactNode;
  /** On the end side of the header: tabs, a select, an action. */
  controls?: ReactNode;
  footer?: ReactNode;
  /** Drop the body padding, e.g. for a table that runs edge to edge. Default false. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

/** A titled card: header with legend and controls, a body, and an optional footer. */
const ContentCard = ({ title, legend, controls, footer, flush = false, className = "", children }: ContentCardProps) => (
  <section className={`mk-surface flex flex-col rounded-card bg-surface-1 ${className}`}>
    {(title || legend || controls) && (
      <header className="flex flex-wrap items-center justify-between gap-space-4 px-space-8 pt-space-8">
        <div className="flex min-w-0 flex-wrap items-center gap-space-5">
          {title && <h2 className="text-title-sm font-medium text-text">{title}</h2>}
          {legend}
        </div>
        {controls && <div className="flex shrink-0 items-center gap-space-3">{controls}</div>}
      </header>
    )}
    <div className={flush ? "pt-space-5" : "px-space-8 py-space-6"}>{children}</div>
    {footer && <footer className="px-space-8 pb-space-6 shadow-rule-t pt-space-5">{footer}</footer>}
  </section>
);

export { ContentCard };
export type { ContentCardProps };
