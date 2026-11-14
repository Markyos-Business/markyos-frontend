import { PublicPageShell } from "@/components/ui";
import { SharePage } from "@/features/sharing";
import { getPublicBadge } from "@/lib/api/public-badge";

/** A link-shared part of a brand guide. */
export default async function SharePageRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const badge = await getPublicBadge("share", token);
  return (
    <PublicPageShell showBadge={badge?.show ?? false} pageType="guide" locale={badge?.locale ?? "en"} pageId={badge?.pageId} workspaceId={badge?.workspaceId}>
      <SharePage token={token} />
    </PublicPageShell>
  );
}
