"use client";

import { useState } from "react";
import type { z } from "zod";

type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * A form's values, checked against a zod schema. `submit` validates, puts
 * the first message of each field under it, and hands back the parsed
 * values — or null when something needs fixing. Editing a field clears its
 * error.
 */
const useZodForm = <S extends z.ZodType<Record<string, unknown>>>(schema: S, initial: z.input<S>) => {
  type Values = z.input<S>;
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<FieldErrors<Values>>({});

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...(v as Record<string, unknown>), [key]: value }) as Values);
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const submit = (): z.output<S> | null => {
    const parsed = schema.safeParse(values);
    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }
    const next: FieldErrors<Values> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof Values | undefined;
      if (key !== undefined && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return null;
  };

  const reset = () => {
    setValues(initial);
    setErrors({});
  };

  return { values, set, errors, setErrors, submit, reset };
};

export { useZodForm };
export type { FieldErrors };
