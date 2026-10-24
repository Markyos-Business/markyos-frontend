"use client";

import { Icon } from "@/components/ui";

type PasswordMatchProps = {
  password: string;
  confirmation: string;
};

/**
 * Live "do these match" under a confirm-password field. Silent until
 * something is typed; warning, not danger, while they differ, because the
 * field's own error on submit is the authoritative one.
 */
const PasswordMatch = ({ password, confirmation }: PasswordMatchProps) => {
  if (!confirmation) return null;
  const matches = password === confirmation;
  return (
    <p aria-live="polite" className={`flex items-center gap-1.5 text-ui-xs ${matches ? "text-success" : "text-warning"}`}>
      <Icon name={matches ? "check" : "times"} size={13} className="shrink-0" />
      <span>{matches ? "Passwords match" : "Passwords do not match"}</span>
    </p>
  );
};

export { PasswordMatch };
export type { PasswordMatchProps };
