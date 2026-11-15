import { notFound } from "next/navigation";
import { FilterGallery } from "@/features/design-system";
export default function FiltersPage(){if(process.env.NEXT_PUBLIC_UI_GALLERY!=="1")notFound();return <FilterGallery/>;}
