import { redirect } from "next/navigation";

/**
 * A link sent for a first-generation discovery brief. The brief moved to a
 * discovery form that kept its token, so the same link opens the new form.
 */
export default async function BriefLinkRedirect({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/f/${token}`);
}
