"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

export default function RootPage() {
  const { state, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(state.session ? "/brands" : "/login");
  }, [hydrated, state.session, router]);

  return null;
}
