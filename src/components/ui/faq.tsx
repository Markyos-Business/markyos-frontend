"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./icon";

type FaqItem = { question: string; answer: ReactNode };

type FaqProps = {
  items: FaqItem[];
  /** Open on first render; `null` starts with everything closed. */
  defaultOpenIndex?: number | null;
  /** More than one open at once. By default opening one closes the other. */
  allowMultiple?: boolean;
  className?: string;
};

/**
 * Questions and answers, one card each. A card opens to its own height (grid
 * rows, no measuring) as its answer fades in, and the open card takes the
 * accent edge. The heading
 * above it is the caller's.
 */
const Faq = ({ items, defaultOpenIndex = 0, allowMultiple = false, className = "" }: FaqProps) => {
  const baseId = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set(defaultOpenIndex === null ? [] : [defaultOpenIndex]));

  const toggle = (index: number) =>
    setOpen((prev) => {
      if (allowMultiple) {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      }
      return prev.has(index) ? new Set() : new Set([index]);
    });

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {items.map((item, index) => {
        const isOpen = open.has(index);
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div
            key={index}
            className={`overflow-hidden rounded-card bg-surface-1 transition-shadow ${isOpen ? "shadow-edge-primary" : "shadow-edge"}`}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex min-h-widget-row w-full items-center justify-between gap-space-5 px-space-8 py-space-5 text-start text-h5 font-medium text-text"
            >
              <span dir="auto" className="bidi-auto">
                {item.question}
              </span>
              <Icon
                name="angle-down"
                size={18}
                className={`shrink-0 transition-[rotate,color] duration-base ${isOpen ? "rotate-180 text-accent-text" : "text-text-muted"}`}
              />
            </button>
            {/* `inert` takes closed content out of reach of Tab and screen
                readers, not just out of sight, while it can still animate shut. */}
            <div id={panelId} role="region" aria-label={item.question} inert={!isOpen} className="mk-collapse" data-open={isOpen}>
              <div>
                <div dir="auto" className="bidi-auto px-space-8 pb-space-8 text-body text-text-muted shadow-rule-t pt-space-6">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { Faq };
export type { FaqItem, FaqProps };
