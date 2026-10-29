import { Suspense } from "react";
import { AdminUserView } from "@/components/features/admin";

/** One Markyos account, for a platform admin. The open tab lives in the URL. */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <AdminUserView id={id} />
    </Suspense>
  );
}
