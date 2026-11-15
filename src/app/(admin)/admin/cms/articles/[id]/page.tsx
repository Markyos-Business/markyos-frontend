import { ArticleEditorView } from "@/features/content";

export default async function ArticlePage({ params }: PageProps<"/admin/cms/articles/[id]">) {
  const { id } = await params;
  return <ArticleEditorView id={id} />;
}
