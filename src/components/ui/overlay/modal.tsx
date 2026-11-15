"use client";
import { Popup, type PopupProps, type PopupSize } from "../popup";
export type ModalSize = PopupSize;
export type ModalProps = Omit<PopupProps, "open" | "onOpenChange"> & { open?: boolean; onClose: () => void };
/** Compatibility name: every existing feature modal uses the shared Popup. */
export function Modal({ open = true, onClose, ...props }: ModalProps) {
  return <Popup {...props} open={open} onOpenChange={next => { if (!next) onClose(); }} />;
}
