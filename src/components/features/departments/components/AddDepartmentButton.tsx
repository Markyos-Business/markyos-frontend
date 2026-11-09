import { IconButton } from "@/components/ui";

/** The round plus beside the department tabs. */
export function AddDepartmentButton({ onAdd, isAr }: { onAdd: () => void; isAr: boolean }) {
  return <IconButton variant="soft" icon="plus" label={isAr ? "إضافة قسم" : "Add department"} onClick={onAdd} />;
}
