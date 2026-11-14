"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
import { useAsyncButton } from "./use-async-button";
export interface ConfirmButtonProps extends ButtonProps {
  mode?: "inline" | "dialog";
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  cancelLabel?: string;
  confirmLabel?: string;
}
export const ConfirmButton = forwardRef<HTMLButtonElement, ConfirmButtonProps>(function ConfirmButton({ mode = "inline", onConfirm, confirmText = "Click again to delete", dialogTitle = "Delete item?", dialogDescription = "This action cannot be undone.", cancelLabel = "Cancel", confirmLabel = "Delete item", children = "Delete item", onClick, ...props }, ref) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const armedUntil = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const action = useAsyncButton(async () => { await onConfirm(); });
  useEffect(() => () => clearTimeout(timer.current), []);
  function confirm() { clearTimeout(timer.current); armedUntil.current = 0; setArmed(false); dialog.current?.close(); void action.run(); }
  return <>
    <Button {...props} ref={ref} status={props.status ?? action.status} variant={props.variant ?? "destructive"} aria-haspopup={mode === "dialog" ? "dialog" : undefined} onClick={(event) => {
      onClick?.(event); if (event.defaultPrevented) return;
      if (mode === "dialog") { dialog.current?.showModal(); return; }
      if (Date.now() < armedUntil.current) { confirm(); return; }
      clearTimeout(timer.current); armedUntil.current = Date.now() + 3000; setArmed(true);
      timer.current = setTimeout(() => { armedUntil.current = 0; setArmed(false); }, 3000);
    }}>{armed ? confirmText : children}</Button>
    <span role="status" className="sr-only">{armed ? confirmText : ""}</span>
    <dialog ref={dialog} aria-label={dialogTitle} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-surface-1 p-6 text-text shadow-pop backdrop:bg-ink-soft">
      <h2 className="text-h5 font-medium">{dialogTitle}</h2><p className="mt-3 text-body text-text-muted">{dialogDescription}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2"><Button autoFocus onClick={() => dialog.current?.close()}>{cancelLabel}</Button><Button variant="destructive" disabled={props.disabled || props.loading || props.locked || !!props.disabledReason || props.status === "loading"} onClick={confirm}>{confirmLabel}</Button></div>
    </dialog>
  </>;
});
