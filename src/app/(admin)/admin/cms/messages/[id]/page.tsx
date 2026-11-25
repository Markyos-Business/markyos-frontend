import { MessageDetailView } from "@/features/content";

export default async function MessagePage({ params }: PageProps<"/admin/cms/messages/[id]">) {
  const { id } = await params;
  return <MessageDetailView id={id} />;
}
