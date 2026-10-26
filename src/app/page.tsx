"use client";

import { useHomeRedirect } from "@/contexts/pageGuards";

export default function RootPage() {
  useHomeRedirect();
  return null;
}
