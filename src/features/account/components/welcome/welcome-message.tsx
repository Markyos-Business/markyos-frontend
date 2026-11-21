"use client";

import { useState, type ReactNode } from "react";
import { WelcomeCard, type WelcomeAction } from "@/components/ui";
import { useCurrentAccount, useSession } from "@/contexts/AppContext";

/** An account this new is greeted as a first visit. */
const FIRST_VISIT_MS = 24 * 60 * 60 * 1000;

/**
 * The welcome at the top of every home screen (brands, admin dashboard,
 * CMS), for whoever is signed in. Each screen passes its own line of
 * context and shortcuts; the name and the first-visit greeting come from the
 * account. Renders inside a DashboardProvider, which sets the language.
 */
export function WelcomeMessage({ message, actions, className }: { message?: ReactNode; actions?: WelcomeAction[]; className?: string }) {
  const account = useCurrentAccount();
  const session = useSession();
  // Read once: the greeting doesn't change while the page is open.
  const [now] = useState(() => Date.now());
  const name = account?.name || session?.name || "";
  if (!session) return null;
  const firstVisit = !!account?.createdAt && now - account.createdAt < FIRST_VISIT_MS;
  return <WelcomeCard name={name} firstVisit={firstVisit} message={message} actions={actions} className={className} />;
}
