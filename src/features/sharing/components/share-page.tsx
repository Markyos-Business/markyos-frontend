"use client";

import { useSharePage } from "../hooks/use-share-page";
import { ShareView } from "./share-view";

/** A share link's page in the browser: the share loads here, after the server frame. */
export function SharePage({ token }: { token: string }) {
  const share = useSharePage(token);
  if (!share) return null;
  return <ShareView share={share} />;
}
