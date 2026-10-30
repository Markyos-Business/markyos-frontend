"use client";

import { AlertBanner, Button } from "@/components/ui";
import { useConfirmEmail } from "../../hooks/confirm-email/useConfirmEmail";
import { AuthShell } from "../shared/AuthShell";

/** Where the "confirm your new email" link lands. */
export function ConfirmEmailView() {
  const { result, signedIn } = useConfirmEmail();
  const next = signedIn ? { href: "/account", label: "Back to your account" } : { href: "/login", label: "Log in" };

  if (result.status === "working") {
    return (
      <AuthShell title="Confirming your email…" subtitle="One moment.">
        {null}
      </AuthShell>
    );
  }
  if (result.status === "failed") {
    return (
      <AuthShell title="This link didn't work" subtitle="Ask for a new one from your account page.">
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
    <AuthShell title="Email confirmed" subtitle="You sign in to Markyos with your new email from now on.">
      <div className="flex flex-col gap-4">
        <p className="text-caption text-text-muted">
          Your email is now{" "}
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
