import type { TeamRole } from "@/types";
import { ROLES } from "../constants";

type RolePickerProps = {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  /** Editor seats are full: the editor chip is disabled, with why. */
  editorsFull: boolean;
  editorsFullNote: string;
};

/** The role a new member joins with, as a row of chips. */
export function RolePicker({
  value,
  onChange,
  editorsFull,
  editorsFullNote,
}: RolePickerProps) {
  return (
    <div className="flex gap-1.5">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          disabled={r === "editor" && editorsFull}
          title={r === "editor" && editorsFull ? editorsFullNote : undefined}
          onClick={() => onChange(r)}
          // The theme's own ink for the chosen role: a literal white pill was
          // a white chip on a white card in the light theme.
          className={`h-8 cursor-pointer rounded-full px-3 text-[11px] font-semibold capitalize ${
            value === r
              ? "bg-solid text-solid-ink"
              : "bg-surface-1 text-text-muted"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
