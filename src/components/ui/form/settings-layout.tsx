"use client";

import { useId } from "react";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: ReactNode;
  /** The heading's level in the page. Default 2. */
  headingLevel?: 2 | 3;
  children: ReactNode;
};

/** One row of a settings page: what it is on the start side, its fields on the end. */
const SettingsSection = ({ title, description, headingLevel = 2, children }: SettingsSectionProps) => {
  const id = useId();
  const H = `h${headingLevel}` as const;
  return (
    <section aria-labelledby={`${id}-title`} className="grid grid-cols-1 gap-x-space-10 gap-y-space-5 py-space-10 first:pt-0 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-space-2">
        <H id={`${id}-title`} className="text-h5 font-medium text-text">
          {title}
        </H>
        {description && <p className="text-caption text-text-muted">{description}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-space-6">{children}</div>
    </section>
  );
};

type SettingsLayoutProps = { className?: string; children: ReactNode };

/**
 * A settings page: rows of a title and description beside their fields,
 * split by hairlines. From the medium breakpoint the text takes a fixed
 * column; below it the text sits above its fields.
 */
const Layout = ({ className = "", children }: SettingsLayoutProps) => <div className={`flex flex-col [&>*+*]:shadow-rule-t ${className}`}>{children}</div>;

const SettingsLayout = Object.assign(Layout, { Section: SettingsSection });

export { SettingsLayout, SettingsSection };
export type { SettingsLayoutProps, SettingsSectionProps };
