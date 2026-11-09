"use client";

import { useState } from "react";
import { Icon } from "../primitives/Icon";
import { useToast } from "../overlays/Toast";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

type CopyButtonProps = {
  /** What goes on the clipboard. */
  text: string;
  /** The button's words, e.g. "Copy link". */
  label: string;
  /** Said in a toast once copied, e.g. "Link copied". */
  copiedMessage: string;
  /** Said when the browser refuses, e.g. "Couldn't copy — copy it from the address bar." */
  failedMessage: string;
  /** Shown on the button for a moment after copying, e.g. "Copied". */
  copiedLabel?: string;
  /** After a successful copy, e.g. to record that the value was handed out. */
  onCopied?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
};

/**
 * Copies a link or code and says so. One button for every "copy" in the
 * product, so they all behave alike: the label turns to the copied word for
 * two seconds, a toast confirms, and a refused clipboard says what to do.
 */
const CopyButton = ({
  text,
  label,
  copiedMessage,
  failedMessage,
  copiedLabel,
  onCopied,
  variant = "outline",
  size = "sm",
  disabled,
  className,
}: CopyButtonProps) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(copiedMessage, "success");
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(failedMessage, "danger");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
      onClick={() => void copy()}
      icon={<Icon name={copied ? "check" : "link"} size={16} />}
    >
      {copied && copiedLabel ? copiedLabel : label}
    </Button>
  );
};

export { CopyButton };
export type { CopyButtonProps };
