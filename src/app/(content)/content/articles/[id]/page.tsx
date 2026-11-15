import { ArticleEditorView } from "@/features/content";

export default async function ArticlePage({ params }: PageProps<"/content/articles/[id]">) {
  const { id } = await params;
  return <ArticleEditorView id={id} />;
}
