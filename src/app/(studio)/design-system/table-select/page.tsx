import { notFound } from "next/navigation";
import { TableSelectGallery } from "@/components/features/design-system";
export default function TableSelectPage() {
  if (process.env.NEXT_PUBLIC_UI_GALLERY !== "1") notFound();
  return <TableSelectGallery />;
}
