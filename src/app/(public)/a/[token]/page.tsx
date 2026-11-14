import { PublicPageShell } from "@/components/ui";
import { PublicReportView } from "@/features/briefs";
import { getPublicBadge } from "@/lib/api/public-badge";

/** A brief analysis the studio shared with its client. No account; the link is the key. */
export default async function SharedAnalysisPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const badge = await getPublicBadge("analysis", token);
  return (
    <PublicPageShell showBadge={badge?.show ?? false} pageType="other" locale={badge?.locale ?? "en"} pageId={badge?.pageId} workspaceId={badge?.workspaceId}>
      <PublicReportView token={token} />
    </PublicPageShell>
  );
}
