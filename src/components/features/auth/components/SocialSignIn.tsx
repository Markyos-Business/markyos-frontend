"use client";

import { Button, Icon, useToast } from "@/components/ui";

/** The "OR" rule and the Google button under the login and signup forms. */
export function SocialSignIn() {
  const { showToast } = useToast();
  return (
    <>
      <div className="flex items-center gap-3 text-[11px] text-text-faint">
        <span className="h-px flex-1 bg-hairline" />
        OR
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => showToast("Social login isn't wired up in this build.")}
        icon={<Icon name="google" size={17} />}
      >
        Continue with Google
      </Button>
    </>
  );
}
