"use client";

import Link from "next/link";
import { useUiStrings } from "./ui-strings";

type BreadcrumbItem = {
  label: string;
  /** Omit on the current page, and on a level that has no page of its own. */
  href?: string;
};

type BreadcrumbProps = {
  /** Outermost first; the last item is the current page. */
  items: BreadcrumbItem[];
  /** The landmark's name; defaults to the kit's "Breadcrumb" in the active language. */
  label?: string;
  className?: string;
};

/**
 * Where a page sits: "Markyos / Strategy". One trail for every page, so the
 * page's own h1 is the only heading that names it.
 *
 * Each label is bidi-isolated: a brand called "Acme Co." in an Arabic trail
 * would otherwise pull the separator and its own full stop to the wrong side.
 */
const Breadcrumb = ({ items, label, className = "" }: BreadcrumbProps) => {
  const { t } = useUiStrings();
  if (!items.length) return null;
  const last = items.length - 1;
  return (
    <nav aria-label={label ?? t.breadcrumb} className={`min-w-0 ${className}`}>
      <ol className="flex min-w-0 items-center gap-space-3 text-body text-text-muted">
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} className={`flex min-w-0 items-center gap-space-3 ${index === last ? "" : "max-w-[50%]"}`}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {index === last ? (
              <bdi aria-current="page" className="truncate text-text">{item.label}</bdi>
            ) : item.href ? (
              <Link href={item.href} className="truncate py-0.5 text-text-muted no-underline" /* 21px line + 4 = a 25px target (WCAG 2.5.8) */><bdi>{item.label}</bdi></Link>
            ) : (
              <bdi className="truncate">{item.label}</bdi>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export { Breadcrumb };
export type { BreadcrumbProps, BreadcrumbItem };
