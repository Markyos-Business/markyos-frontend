import { HelpArticleEditor } from "@/features/helpcenter";

export default async function Page({ params }: PageProps<"/admin/cms/help/articles/[id]">) {
  const { id } = await params;
  return <HelpArticleEditor id={id} />;
}
