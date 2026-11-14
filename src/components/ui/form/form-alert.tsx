"use client";

import { AlertBanner, type AlertBannerProps } from "../alert-banner";
import { useFormMeta } from "./form-context";

type FormAlertProps = Partial<AlertBannerProps>;

/**
 * The banner at the top of a form. Given a message it shows that (a server
 * error, a warning, a note); given nothing it shows the Form's last outcome:
 * "Changes saved." or the server's refusal. Built on AlertBanner, so it opens
 * and closes smoothly and is announced (errors at once, the rest politely).
 */
const FormAlert = ({ message, tone, ...rest }: FormAlertProps) => {
  const meta = useFormMeta();
  if (message !== undefined) return <AlertBanner message={message} tone={tone} {...rest} />;
  const { outcome } = meta;
  return (
    <AlertBanner
      message={outcome.kind === "idle" ? undefined : outcome.message}
      tone={outcome.kind === "success" ? "success" : "danger"}
      {...rest}
    />
  );
};

export { FormAlert };
export type { FormAlertProps };
