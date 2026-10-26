"use client";

import { useParams } from "next/navigation";
import { ShareView, useSharePage } from "@/components/features/sharing";

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const share = useSharePage(token);
  if (!share) return null;
  return <ShareView share={share} />;
}
