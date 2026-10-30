"use client";

import { AlertBanner, Button } from "@/components/ui";
import { RadioCardGroup, labelClasses } from "@/components/form";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { GoogleSignInState } from "../../hooks/shared/useGoogleSignIn";
import type { SignupFormState } from "../../hooks/signup/useSignupForm";
import { SocialSignIn } from "../shared/SocialSignIn";

/**
 * Step one: who the account is for. Google comes first as the quickest way
 * in; it takes the type too if one is already picked.
 */
export function SignupTypeStep({ form, google }: { form: SignupFormState; google: GoogleSignInState }) {
  return (
    <div className="flex flex-col gap-4">
      <SocialSignIn google={google} />
      <form onSubmit={form.toDetails} className="flex flex-col gap-4" noValidate>
        <AlertBanner message={form.errors.form} />
        <div className="flex flex-col gap-space-3">
          {/* Asked first and never preselected: it decides the plans, limits
              and wording the account gets. */}
          <span className={labelClasses}>Who is this account for?</span>
          <RadioCardGroup
            label="Who is this account for?"
            compact
            options={ACCOUNT_TYPE_KEYS.map((key) => ({
              value: key,
              label: ACCOUNT_TYPES[key].label,
              hint: ACCOUNT_TYPES[key].description,
              icon: ACCOUNT_TYPES[key].icon,
            }))}
            value={form.accountType}
            onChange={form.chooseAccountType}
            error={form.errors.accountType}
          />
        </div>
        <Button type="submit" variant="primary" className="mt-1 w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
