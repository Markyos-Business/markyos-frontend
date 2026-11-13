"use client";

import { useState } from "react";
import { useUiStrings } from "../ui-strings";
import { InputField, type InputFieldProps } from "./input-field";

type UrlFieldProps = Omit<InputFieldProps, "type" | "value" | "defaultValue" | "onChange" | "prefix"> & {
  /** The full address, protocol included ("https://markyos.com"), or "". */
  value: string;
  onChange: (url: string) => void;
  /** Shown fixed before the address. Default "https://". */
  protocol?: "https://" | "http://";
  invalidMessage?: string;
};

const PROTOCOL = /^(https?:\/\/)/i;

/** Whether `url` is a full web address with a dotted host. */
function isWebAddress(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * A web address with its protocol as a fixed prefix, so nobody types
 * "https://" and nobody forgets it. A pasted full address loses its own
 * protocol into the prefix. Controlled: use react-hook-form's `Controller`.
 */
const UrlField = ({ value, onChange, protocol: initial = "https://", error, invalidMessage, onBlur, ...rest }: UrlFieldProps) => {
  const { t } = useUiStrings();
  const [protocol, setProtocol] = useState(() => (value.match(PROTOCOL)?.[1].toLowerCase() as UrlFieldProps["protocol"]) ?? initial);
  const [invalid, setInvalid] = useState(false);
  const rest_ = value.replace(PROTOCOL, "");

  return (
    <InputField
      type="text"
      inputMode="url"
      autoComplete="url"
      spellCheck={false}
      dir="ltr"
      boxDir="ltr"
      {...rest}
      prefix={<span className="text-text-muted">{protocol}</span>}
      value={rest_}
      error={error ?? (invalid ? (invalidMessage ?? t.invalidUrl) : undefined)}
      onChange={(e) => {
        let typed = e.target.value.trim();
        const own = typed.match(PROTOCOL)?.[1].toLowerCase() as UrlFieldProps["protocol"] | undefined;
        if (own) {
          setProtocol(own);
          typed = typed.replace(PROTOCOL, "");
        }
        if (invalid && isWebAddress(`${own ?? protocol}${typed}`)) setInvalid(false);
        onChange(typed ? `${own ?? protocol}${typed}` : "");
      }}
      onBlur={(e) => {
        setInvalid(rest_ !== "" && !isWebAddress(`${protocol}${rest_}`));
        onBlur?.(e);
      }}
    />
  );
};

/** UrlInput, by the UI library's name. */
const UrlInput = UrlField;

export { UrlField, UrlInput, isWebAddress };
export type { UrlFieldProps };
