"use client";

import { AlertBanner, Button } from "@/components/ui";
import { RadioCardGroup, labelClasses } from "@/components/ui";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_KEYS } from "@/constants/accountTypes";
import type { GoogleSignInState } from "../../hooks/shared/use-google-sign-in";
import type { SignupFormState } from "../../hooks/signup/use-signup-form";
import { SocialSignIn } from "../shared/social-sign-in";
import { useAuthLang } from "../../hooks/shared/use-auth-lang";

/**
 * Step one: choose who the account is for before either signup method.
 */
export function SignupTypeStep({ form, google }: { form: SignupFormState; google: GoogleSignInState }) {
  const { lang, c } = useAuthLang();
  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={form.toDetails} className="flex flex-col gap-4" noValidate>
        <AlertBanner message={form.errors.form} />
        <div className="flex flex-col gap-space-3">
          {/* Asked first and never preselected: it decides the plans, limits
              and wording the account gets. */}
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
            value={form.accountType}
            onChange={form.chooseAccountType}
            error={form.errors.accountType}
          />
        </div>
        <Button type="submit" variant="primary" className="mt-1 w-full">
          {c.signup.continue}
        </Button>
      </form>
      {form.accountType && <SocialSignIn google={google} />}
    </div>
  );
}
