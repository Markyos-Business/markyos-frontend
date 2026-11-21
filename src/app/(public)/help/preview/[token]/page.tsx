import type { Metadata } from "next";
import { HelpPreviewView } from "@/features/helpcenter";

// A private draft: never indexed, never cached by a crawler.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // The token holds ":" separators, which arrive percent-encoded in the route param.
  return <HelpPreviewView token={decodeURIComponent(token)} />;
}
