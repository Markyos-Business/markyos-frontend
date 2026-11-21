import { notFound } from "next/navigation";
import { DashboardGallery } from "@/features/design-system";
export default function DashboardGalleryPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <DashboardGallery />;
}
