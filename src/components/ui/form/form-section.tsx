"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { SurfaceCard } from "../card/surface-card";
import { Icon } from "../icon";

type FormSectionProps = {
  title: string;
  description?: ReactNode;
  /** An 18px icon beside the title. */
  icon?: string;
  /** plain: a heading and its fields. card: the same on a surface card. */
  variant?: "plain" | "card";
  /** The heading's level in the page. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** Beside the title: a Reset link, a badge. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * A titled part of a form: "Brand", "Notifications". A `section` named by
 * its heading, so it's a landmark a screen reader can jump to and announces
 * the group as you enter it. For choices that answer one question, use
 * Fieldset (a legend) inside it instead.
 */
const FormSection = ({ title, description, icon, variant = "plain", headingLevel = 2, aside, className = "", children }: FormSectionProps) => {
  const id = useId();
  const H = `h${headingLevel}` as const;
  const body = (
    <>
      <header className="flex items-start justify-between gap-space-5">
        <div className="flex min-w-0 flex-col gap-space-1">
          <H id={`${id}-title`} className="flex items-center gap-space-3 text-h5 font-medium text-text">
            {icon && <Icon name={icon} size={18} className="text-text-muted" />}
            {title}
          </H>
          {description && <p className="text-caption text-text-muted">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </>
  );
  return variant === "card" ? (
    <SurfaceCard as="section" aria-labelledby={`${id}-title`} className={`flex min-w-0 flex-col gap-field-stack ${className}`}>
      {body}
    </SurfaceCard>
  ) : (
    <section aria-labelledby={`${id}-title`} className={`flex min-w-0 flex-col gap-field-stack ${className}`}>
      {body}
    </section>
  );
};

export { FormSection };
export type { FormSectionProps };
