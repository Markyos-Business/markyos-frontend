"use client";
import { Button } from "../../button/button";
import { Icon } from "../../icon";
import type { CardLinkButtonProps } from "../types";
export default function CardLinkButton({ href, label, tone = "secondary", className }: CardLinkButtonProps) {
  return <Button href={href} aria-label={label} title={label} size="md" variant={tone === "primary" ? "primary" : "secondary"} className={className}>
    <Icon name="arrow-right" />
  </Button>;
}
