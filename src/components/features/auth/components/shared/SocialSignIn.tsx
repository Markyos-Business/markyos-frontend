"use client";

import { AlertBanner, Button, Icon, useToast } from "@/components/ui";
import type { GoogleSignInState } from "../../hooks/useGoogleSignIn";

/** The "OR" rule and the Google button under the login and signup forms. */
export function SocialSignIn({ google }: { google: GoogleSignInState }) {
  const { showToast } = useToast();
  return (
    <>
      <div className="flex items-center gap-3 text-[11px] text-text-faint">
        <span className="h-px flex-1 bg-hairline" />
        OR
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <AlertBanner message={google.error} />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={google.busy}
        onClick={google.enabled ? google.start : () => showToast("Google sign-in isn't set up in this build.")}
        icon={<Icon name="google" size={17} />}
      >
        {google.busy ? "Waiting for Google…" : "Continue with Google"}
      </Button>
    </>
  );
}
