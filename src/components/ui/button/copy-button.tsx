"use client";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { useOptionalToast } from "../overlay/toast";
import { useUiStrings } from "../ui-strings";
import { Button, type ButtonProps } from "./button";
import { useAsyncButton } from "./use-async-button";
export interface CopyButtonProps extends Omit<ButtonProps, "value"> {
  text?: string;
  value?: string;
  label?: string;
  /** A sentence confirming the copy, shown as a toast. */
  copiedMessage?: string;
  /** A sentence saying what to do when copying fails, shown as a toast. */
  failedMessage?: string;
  /** The button's own short label once copied. */
  copiedLabel?: string;
  onCopied?: () => void;
}
/**
 * Copies a value. The button itself only ever says a word or two ("Copied",
 * "Retry"): a Button reserves the width of every state label it might show,
 * so a sentence there stretched the button across its row. Sentences go to a
 * toast instead.
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton({ text, value, label, copiedMessage, failedMessage, copiedLabel, onCopied, ...props }, ref) {
  const { t } = useUiStrings();
  const toast = useOptionalToast();
  const action = useAsyncButton(async () => {
    try {
      await navigator.clipboard.writeText(value ?? text ?? "");
    } catch (err) {
      if (failedMessage) toast?.showToast(failedMessage, "danger");
      throw err;
    }
    if (copiedMessage) toast?.showToast(copiedMessage, "success");
    onCopied?.();
  });
  return <Button {...props} ref={ref} status={props.status ?? action.status} loadingText={props.loadingText ?? t.copy} successText={copiedLabel ?? t.copied} errorText={t.retry} icon={<Icon name="copy" size={18} />} onClick={() => void action.run()}>{label ?? t.copy}</Button>;
});
