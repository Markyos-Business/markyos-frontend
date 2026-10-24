"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { homePath } from "@/lib/data/access";

export default function RootPage() {
  const { state, hydrated } = useApp();
  const home = homePath(useCurrentAccount());
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(state.session ? home : "/login");
  }, [hydrated, state.session, router, home]);

  return null;
}
