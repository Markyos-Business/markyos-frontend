"use client";
import { forwardRef, useRef } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps } from "./button";
export interface UploadButtonProps extends ButtonProps { accept?: string; multiple?: boolean; onFiles: (files: File[]) => void; inputLabel?: string; }
export const UploadButton = forwardRef<HTMLButtonElement, UploadButtonProps>(function UploadButton({ accept, multiple, onFiles, inputLabel = "Choose files", children = "Upload files", onClick, ...props }, ref) {
  const input = useRef<HTMLInputElement>(null);
  return <><Button {...props} ref={ref} icon={props.icon ?? <Icon name="upload" size={18} />} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) input.current?.click(); }}>{children}</Button><input ref={input} type="file" hidden aria-label={inputLabel} accept={accept} multiple={multiple} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) onFiles(files); }} /></>;
});
