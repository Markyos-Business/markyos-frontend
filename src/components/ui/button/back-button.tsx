"use client";
import { forwardRef } from "react";
import { Icon } from "../icon";
import { Button, type ButtonProps } from "./button";
export const BackButton = forwardRef<HTMLButtonElement, ButtonProps>(function BackButton({ children = "Back", ...props }, ref) { return <Button {...props} ref={ref} icon={<Icon name="arrow-left" size={18} />}>{children}</Button>; });
