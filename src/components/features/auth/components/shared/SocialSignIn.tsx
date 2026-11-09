"use client";

import { AlertBanner, Button, Icon, useToast } from "@/components/ui";
import type { GoogleSignInState } from "../../hooks/shared/useGoogleSignIn";
import { useAuthLang } from "../../hooks/shared/useAuthLang";

/** The "OR" rule between the Google button and the form. */
const OrRule = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 text-[11px] text-text-faint">
    <span className="h-px flex-1 bg-hairline" />
    {label}
    <span className="h-px flex-1 bg-hairline" />
  </div>
);

/**
 * The Google button and its "OR" rule. It leads the login and signup forms —
 * the quickest way in, offered first — so the rule sits under it, before the
 * form.
 */
export function SocialSignIn({ google }: { google: GoogleSignInState }) {
  const { showToast } = useToast();
  const { c } = useAuthLang();
  return (
    <>
      <AlertBanner message={google.error} />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={google.busy}
        onClick={google.enabled ? google.start : () => showToast(c.google.notSetUp)}
        icon={<Icon name="google" size={17} />}
      >
        {google.busy ? c.google.waiting : c.google.start}
      </Button>
      <OrRule label={c.or} />
    </>
  );
}
