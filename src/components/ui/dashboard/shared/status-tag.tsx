"use client";
import { Tag, type TagProps } from "../../badge/tag";
import type { TagTone } from "../../badge/variants";
/** Status semantics belong to the feature. Unknown statuses stay neutral. */
export interface StatusTagProps {
  status: string;
  tone?: TagTone;
  label?: string;
  size?: TagProps["size"];
  className?: string;
}
export default function StatusTag({ status, label, ...props }: StatusTagProps) {
  return <Tag {...props}>{label ?? status}</Tag>;
}
