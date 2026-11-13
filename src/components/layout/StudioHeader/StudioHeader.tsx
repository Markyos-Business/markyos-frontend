"use client";

import type { ReactNode } from "react";
import { AccountHeader } from "../AccountHeader";

/** Compatibility wrapper: account pages share one complete global header. */
export function StudioHeader(_props: { isAr: boolean; end?: ReactNode }) {
  void _props;
  return <AccountHeader />;
}
