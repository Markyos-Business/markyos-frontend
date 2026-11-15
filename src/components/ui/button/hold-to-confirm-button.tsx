"use client";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";
import { useAsyncButton } from "./use-async-button";
export interface HoldToConfirmButtonProps extends ButtonProps { onConfirm: () => void | Promise<void>; duration?: number; holdLabel?: string; }
export const HoldToConfirmButton = forwardRef<HTMLButtonElement, HoldToConfirmButtonProps>(function HoldToConfirmButton({ onConfirm, duration = 1200, holdLabel = "Hold to confirm", children = holdLabel, disabled, loading, status, locked, disabledReason, onPointerDown, onPointerUp, onPointerCancel, onLostPointerCapture, onKeyDown, onKeyUp, onBlur, onClick, ...props }, ref) {
  const [progress, setProgress] = useState(0);
  const holding = useRef(false);
  const frame = useRef(0);
  const action = useAsyncButton(async () => { await onConfirm(); });
  const cancel = useCallback(() => { holding.current = false; cancelAnimationFrame(frame.current); setProgress(0); }, []);
  const blocked = disabled || loading || locked || !!disabledReason || props.skeleton || status === "loading" || action.loading;
  useEffect(() => {
    // A disabled transition must cancel an in-flight hold before it confirms.
    if (blocked) cancel();
    return () => { holding.current = false; cancelAnimationFrame(frame.current); };
  }, [blocked, cancel]);
  function start() {
    if (blocked || holding.current) return;
    holding.current = true;
    const started = performance.now();
    const step = (now: number) => {
      if (!holding.current) return;
      const next = Math.min(1, (now - started) / Math.max(1, duration));
      setProgress(next);
      if (next === 1) { cancel(); void action.run(); } else frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }
  return <Button {...props} ref={ref} disabled={disabled} loading={loading} locked={locked} disabledReason={disabledReason} status={status ?? action.status}
    onPointerDown={(event) => { onPointerDown?.(event); if (event.defaultPrevented || event.button !== 0 || blocked) return; event.currentTarget.setPointerCapture(event.pointerId); start(); }}
    onPointerUp={(event) => { cancel(); onPointerUp?.(event); }} onPointerCancel={(event) => { cancel(); onPointerCancel?.(event); }} onLostPointerCapture={(event) => { cancel(); onLostPointerCapture?.(event); }}
    onKeyDown={(event) => { onKeyDown?.(event); if (event.defaultPrevented) return; if (event.key === " " || event.key === "Enter") { event.preventDefault(); if (!event.repeat) start(); } if (event.key === "Escape") cancel(); }}
    onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); cancel(); } onKeyUp?.(event); }}
    onBlur={(event) => { cancel(); onBlur?.(event); }} onClick={(event) => { event.preventDefault(); onClick?.(event); }}>
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 rounded-lg bg-ink-soft" style={{ width: `${progress * 100}%` }} />
    <span className="relative">{children}</span>
  </Button>;
});
