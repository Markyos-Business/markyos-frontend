import { PublicPageShell } from "@/components/ui";
import { PublicFormView } from "@/features/discovery";
import { getPublicBadge } from "@/lib/api/public-badge";

/** A discovery form, as the client fills it in. No account; the link is the key. */
export default async function PublicFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Decided on the server for the form's owner: a paid brand's form has no badge in its HTML.
  const badge = await getPublicBadge("form", token);
  return (
    <PublicPageShell showBadge={badge?.show ?? false} pageType="form" locale={badge?.locale ?? "en"} pageId={badge?.pageId} workspaceId={badge?.workspaceId}>
      <PublicFormView token={token} />
    </PublicPageShell>
  );
}
