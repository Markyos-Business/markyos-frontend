import { PublicPageShell } from "@/components/ui";
import { ClientGuideView } from "@/features/guideline-site";
import { getPublicBadge } from "@/lib/api/public-badge";

/** A brand's published guideline site. The server says whether the badge shows: on the account's free site (a brand without a plan), or a paid brand that gives the credit. */
export default async function ClientViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const badge = await getPublicBadge("guide", slug);
  return (
    <PublicPageShell showBadge={badge?.show ?? false} pageType="guide" locale={badge?.locale ?? "en"} pageId={badge?.pageId} workspaceId={badge?.workspaceId}>
      {/* The page's main landmark, around every state (gate, loading, the site).
          `contents` adds no box, so the client's template lays out as before. */}
      <main className="contents">
        <ClientGuideView slug={slug} />
      </main>
    </PublicPageShell>
  );
}
