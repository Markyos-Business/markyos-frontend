import { PublicFormView } from "@/components/features/discovery";

/** A discovery form, as the client fills it in. No account; the link is the key. */
export default async function PublicFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicFormView token={token} />;
}
