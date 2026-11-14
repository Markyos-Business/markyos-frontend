"use client";
import { forwardRef } from "react";
import { IconButton, type IconButtonProps } from "./icon-button";
export const Fab = forwardRef<HTMLButtonElement, IconButtonProps>(function Fab({ className = "", variant = "primary", size = "lg", ...props }, ref) {
  return <IconButton {...props} ref={ref} variant={variant} size={size} shape="round" className={`fixed bottom-6 end-6 z-sticky shadow-pop ${className}`} />;
});
