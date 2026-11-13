"use client";

import { Button, Icon, PageHeader } from "@/components/ui";
import { FilterBar, FilterSelectField, SearchField } from "@/components/ui";
import { MEMBER_ROLES } from "../constants";
import { useInvitePeople } from "../hooks/invite/use-invite-people";
import { usePeopleLang } from "../hooks/use-people-lang";
import type { PeoplePage } from "../hooks/use-people-page";
import { useRemoveEverywhere } from "../hooks/person/use-person-access";
import type { MemberRole } from "../types";
import { InvitePeopleDialog } from "./invite/invite-people-dialog";
import { PeopleTable } from "./list/people-table";
import { PersonSheet } from "./person/person-sheet";

/** Everyone on the brands you own: their roles brand by brand, and inviting more. */
export function PeopleView({ page }: { page: PeoplePage }) {
  const { c } = usePeopleLang();
  const invite = useInvitePeople(page.owned);
  const removeEverywhere = useRemoveEverywhere();

  return (
    <>
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          page.owned.length > 0 && (
            <Button variant="primary" icon={<Icon name="user-plus" size={18} />} onClick={() => invite.start()}>
              {c.invite}
            </Button>
          )
        }
      />

      {page.people.length > 0 && (
        <FilterBar
          active={page.filtered}
          onClear={page.clearFilters}
          search={
            <SearchField
              key={page.searchKey}
              label={c.searchLabel}
              placeholder={c.search}
              value={page.query}
              onChange={(e) => page.setQuery(e.target.value)}
              shortcut
            />
          }
        >
          <FilterSelectField
            label={c.role}
            hideLabel
            icon="user-shield"
            value={page.role}
            onChange={(value) => page.setRole(value as MemberRole | "")}
            options={[{ value: "", label: c.allRoles }, ...MEMBER_ROLES.map((r) => ({ value: r, label: c.roles[r] }))]}
          />
        </FilterBar>
      )}

      <PeopleTable page={page} onInvite={() => invite.start()} onRemoveEverywhere={removeEverywhere} />

      <InvitePeopleDialog invite={invite} owned={page.owned} />
      {page.open && <PersonSheet key={page.open.email} person={page.open} onClose={page.closePerson} />}
    </>
  );
}
