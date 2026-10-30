"use client";

import { FormSheet, Tag } from "@/components/ui";
import { SelectField } from "@/components/form";
import { MEMBER_ROLES } from "../../constants";
import { usePeopleLang } from "../../hooks/usePeopleLang";
import { usePersonAccess } from "../../hooks/usePersonAccess";
import type { AccessChoice } from "../../hooks/usePersonAccess";
import type { Person } from "../../types";

type PersonSheetProps = { person: Person; onClose: () => void };

/** One person's role on each of your brands, changed or removed in one save. */
export function PersonSheet({ person, onClose }: PersonSheetProps) {
  const { c } = usePeopleLang();
  const access = usePersonAccess(person, onClose);
  return (
    <FormSheet
      open
      title={c.sheet.title(person.name)}
      description={
        <>
          <span dir="ltr">{person.email}</span>
          <br />
          {c.sheet.description}
        </>
      }
      submitLabel={c.sheet.save}
      onClose={onClose}
      onSubmit={access.save}
    >
      <div className="flex flex-col gap-space-5">
        {person.brands.map((b) => {
          const choice = access.draft[b.workspaceId];
          return (
            <div key={b.workspaceId} className="flex flex-col gap-space-2">
              <SelectField
                label={b.brandName}
                value={choice}
                onChange={(e) => access.choose(b.workspaceId, e.target.value as AccessChoice)}
                options={[
                  ...MEMBER_ROLES.map((r) => ({ value: r, label: c.roleHelp[r] })),
                  { value: "remove", label: c.sheet.remove },
                ]}
              />
              {choice === "remove" && (
                <Tag tone="danger" className="self-start">
                  {c.sheet.remove}
                </Tag>
              )}
            </div>
          );
        })}
        <p className="text-caption text-text-muted">{c.sheet.removeAllHint}</p>
      </div>
    </FormSheet>
  );
}
