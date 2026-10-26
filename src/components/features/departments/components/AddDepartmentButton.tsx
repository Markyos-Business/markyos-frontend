import { IconButton } from "@/components/ui";

/** The round plus beside the department tabs. */
export function AddDepartmentButton({ onAdd }: { onAdd: () => void }) {
  return <IconButton variant="soft" icon="plus" label="Add department" onClick={onAdd} />;
}
