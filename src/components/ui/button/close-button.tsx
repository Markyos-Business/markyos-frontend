"use client";
import { forwardRef } from "react";
import { IconButton, type IconButtonProps } from "./icon-button";
export type CloseButtonProps = Omit<IconButtonProps, "icon">;
export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(function CloseButton(props, ref) { return <IconButton {...props} ref={ref} icon="times" />; });
