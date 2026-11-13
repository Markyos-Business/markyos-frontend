"use client";

import { AlertBanner, Button } from "@/components/ui";
import { useConfirmEmail } from "../../hooks/confirm-email/use-confirm-email";
import { AuthShell } from "../shared/auth-shell";
import { useAuthLang } from "../../hooks/shared/use-auth-lang";

/** Where the "confirm your new email" link lands. */
export function ConfirmEmailView() {
  const { result, signedIn } = useConfirmEmail();
  const { c } = useAuthLang();
  const next = signedIn ? { href: "/account", label: c.confirm.backToAccount } : { href: "/login", label: c.confirm.login };

  if (result.status === "working") {
    return (
      <AuthShell title={c.confirm.working} subtitle={c.confirm.moment}>
        {null}
      </AuthShell>
    );
  }
  if (result.status === "failed") {
    return (
      <AuthShell title={c.confirm.failedTitle} subtitle={c.confirm.failedSubtitle}>
        <div className="flex flex-col gap-4">
          <AlertBanner message={result.error} />
          <Button variant="primary" className="w-full" href={next.href}>
            {next.label}
          </Button>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={c.confirm.doneTitle} subtitle={c.confirm.doneSubtitle}>
      <div className="flex flex-col gap-4">
        <p className="text-caption text-text-muted">
          {c.confirm.nowIs}{" "}
          <span dir="ltr" className="font-medium text-text">
            {result.email}
          </span>
        </p>
        <Button variant="primary" className="w-full" href={next.href}>
          {next.label}
        </Button>
      </div>
    </AuthShell>
  );
}
