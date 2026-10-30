import { PublicReportView } from "@/components/features/briefs";

/** A brief analysis the studio shared with its client. No account; the link is the key. */
export default async function SharedAnalysisPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicReportView token={token} />;
}
