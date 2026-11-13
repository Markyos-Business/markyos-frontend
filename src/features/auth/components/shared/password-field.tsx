"use client";

import { PasswordField as KitPasswordField, type PasswordFieldProps } from "@/components/ui";
import { useAuthLang } from "../../hooks/shared/use-auth-lang";

type Props = Omit<PasswordFieldProps, "strings" | "label"> & { label: string };

/**
 * The kit's password field in the auth pages' own words, so sign-in, sign-up
 * and reset say "Show password" and rate a password the same way everywhere.
 */
export function PasswordField(props: Props) {
  const { c } = useAuthLang();
  return (
    <KitPasswordField
      {...props}
      strings={{
        show: c.fields.showPassword,
        hide: c.fields.hidePassword,
        levels: c.strength.levels,
        labels: { tooCommon: c.strength.tooCommon, tooSimple: c.strength.tooSimple },
        advice: {
          commonAdvice: c.strength.commonAdvice,
          repeatAdvice: c.strength.repeatAdvice,
          lengthAdvice: c.strength.lengthAdvice,
          moreAdvice: c.strength.moreAdvice,
        },
      }}
    />
  );
}
