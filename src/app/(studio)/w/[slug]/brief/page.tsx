import { redirect } from "next/navigation";

/** The discovery brief became discovery forms; old links land there. */
export default async function BriefRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/w/${slug}/forms`);
}
