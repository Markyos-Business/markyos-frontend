"use client";

import { AlertBanner, Button } from "@/components/ui";
import { RadioCardGroup } from "@/components/form";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { GoogleSignInState } from "../../hooks/useGoogleSignIn";
import { AuthShell } from "./AuthShell";

/**
 * Someone new arrived through Google. They have a name and a verified email,
 * but not yet the one thing signup also asks: who the account is for.
 */
export function GoogleSignupStep({ google }: { google: GoogleSignInState }) {
  if (!google.pending) return null;
  const { name, email } = google.pending;
  return (
    <AuthShell title={`Welcome${name ? `, ${name}` : ""}`} subtitle="One last thing before your account is ready.">
      <div className="flex flex-col gap-4">
        <p className="text-caption text-text-muted">
          Signing up as <span dir="ltr" className="font-medium text-text">{email}</span>
        </p>
        <AlertBanner message={google.error} />
        <div className="flex flex-col gap-space-2">
          <span className="text-caption text-text-muted">Who is this account for?</span>
          <RadioCardGroup
            label="Who is this account for?"
            columns={1}
            options={ACCOUNT_TYPE_KEYS.map((key) => ({
              value: key,
              label: ACCOUNT_TYPES[key].label,
              hint: ACCOUNT_TYPES[key].description,
              icon: ACCOUNT_TYPES[key].icon,
            }))}
            value={google.chosen}
            onChange={google.choose}
          />
        </div>
        <Button type="button" variant="primary" className="w-full" onClick={google.finish} disabled={!google.chosen || google.busy}>
          {google.busy ? "Creating account…" : "Create account"}
        </Button>
        <Button type="button" variant="link" onClick={google.cancel}>
          Back
        </Button>
      </div>
    </AuthShell>
  );
}
