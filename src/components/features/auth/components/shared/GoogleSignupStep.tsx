"use client";

import { AlertBanner, Button } from "@/components/ui";
import { RadioCardGroup, labelClasses } from "@/components/form";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { GoogleSignInState } from "../../hooks/shared/useGoogleSignIn";
import { AuthShell } from "./AuthShell";
import { useAuthLang } from "../../hooks/shared/useAuthLang";

/**
 * Someone new arrived through Google. They have a name and a verified email,
 * but not yet the one thing signup also asks: who the account is for.
 */
export function GoogleSignupStep({ google }: { google: GoogleSignInState }) {
  const { lang, c } = useAuthLang();
  if (!google.pending) return null;
  const { name, email } = google.pending;
  return (
    <AuthShell title={c.google.welcome(name ?? "")} subtitle={c.google.lastThing}>
      <div className="flex flex-col gap-4">
        <p className="text-caption text-text-muted">
          {c.google.signingUpAs} <span dir="ltr" className="font-medium text-text">{email}</span>
        </p>
        <AlertBanner message={google.error} />
        <div className="flex flex-col gap-space-2">
          <span className={labelClasses}>{c.signup.who}</span>
          <RadioCardGroup
            label={c.signup.who}
            columns={1}
            options={ACCOUNT_TYPE_KEYS.map((key) => ({
              value: key,
              label: lang === "ar" ? ACCOUNT_TYPES[key].arLabel : ACCOUNT_TYPES[key].label,
              hint: lang === "ar" ? ACCOUNT_TYPES[key].arDescription : ACCOUNT_TYPES[key].description,
              icon: ACCOUNT_TYPES[key].icon,
            }))}
            value={google.chosen}
            onChange={google.choose}
          />
        </div>
        <Button type="button" variant="primary" className="w-full" onClick={google.finish} disabled={!google.chosen || google.busy}>
          {google.busy ? c.signup.creatingAccount : c.signup.submit}
        </Button>
        <Button type="button" variant="link" onClick={google.cancel}>
          {c.signup.back}
        </Button>
      </div>
    </AuthShell>
  );
}
