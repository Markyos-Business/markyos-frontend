"use client";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps } from "./button";
import { useAsyncButton } from "./use-async-button";
export interface CopyButtonProps extends Omit<ButtonProps, "value"> {
  text?: string;
  value?: string;
  label?: string;
  copiedMessage?: string;
  failedMessage?: string;
  copiedLabel?: string;
  onCopied?: () => void;
}
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton({ text, value, label = "Copy link", copiedMessage, failedMessage = "Try again", copiedLabel = "Copied", onCopied, ...props }, ref) {
  const action = useAsyncButton(async () => { await navigator.clipboard.writeText(value ?? text ?? ""); onCopied?.(); });
  return <Button {...props} ref={ref} status={props.status ?? action.status} loadingText={props.loadingText ?? "Copying"} successText={copiedMessage ?? copiedLabel} errorText={failedMessage} icon={<Icon name="copy" size={18} />} onClick={() => void action.run()}>{label}</Button>;
});
