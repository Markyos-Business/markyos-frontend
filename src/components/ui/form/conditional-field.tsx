"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useFormContext, useWatch, type FieldValues, type Path } from "react-hook-form";
import { usePresence } from "@/hooks/usePresence";

type ConditionalFieldProps<V extends FieldValues = FieldValues> = {
  /** Shown while this is true of the form's values. */
  when: (values: V) => boolean;
  /** The fields inside, unregistered once hidden so their values and errors go too. */
  fields: readonly Path<V>[];
  children: ReactNode;
};

/**
 * Fields that only apply sometimes: "Media budget" once "Paid media" is on.
 * They open and close smoothly, and once closed they're unregistered, so a
 * hidden field neither submits a stale value nor blocks the form with an
 * error nobody can see. Closed, the content leaves the page (and the tab
 * order); while closing it's inert.
 */
function ConditionalField<V extends FieldValues = FieldValues>({ when, fields, children }: ConditionalFieldProps<V>) {
  const { control, unregister } = useFormContext<V>();
  const values = useWatch({ control }) as V;
  const open = when(values);
  const { mounted, closing } = usePresence(open);
  const wasMounted = useRef(mounted);

  // After the content (and its Controllers) leave, let go of their values.
  useEffect(() => {
    if (wasMounted.current && !mounted) unregister(fields as Path<V>[]);
    wasMounted.current = mounted;
  }, [mounted, unregister, fields]);

  if (!mounted) return null;
  return (
    <div className="mk-collapse" data-open={open && !closing} inert={closing || undefined}>
      <div className="flex flex-col gap-space-6">{children}</div>
    </div>
  );
}

export { ConditionalField };
export type { ConditionalFieldProps };
