"use client";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps } from "./button";
export interface ProviderButtonProps extends ButtonProps { provider: "google" | "microsoft" | "apple"; label?: string; }
const labels = { google: "Continue with Google", microsoft: "Continue with Microsoft", apple: "Continue with Apple" };
export const ProviderButton = forwardRef<HTMLButtonElement, ProviderButtonProps>(function ProviderButton({ provider, label, children, ...props }, ref) {
  return <Button {...props} ref={ref} icon={<Icon name={provider} size={18} />}>{children ?? label ?? labels[provider]}</Button>;
});
