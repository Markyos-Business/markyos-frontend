import { notFound } from "next/navigation";
import { TabsGalleryPage } from "@/features/design-system";
export default function Page() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <TabsGalleryPage />;
}
