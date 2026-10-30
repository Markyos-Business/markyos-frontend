"use client";

import { useMemo, useState } from "react";
import { useApp, useCurrentAccount } from "@/contexts/AppContext";
import { useStudioPage } from "@/contexts/pageGuards";
import type { MemberRole, Person } from "../types";
import { aggregatePeople, filterPeople } from "../utils/aggregatePeople";

/**
 * The People page: everyone on the brands you own, searchable, with the
 * person whose access sheet is open. Every change goes through the brand's
 * own team, so saving, invite emails and the server's rules stay in one path.
 */
export function usePeoplePage() {
  const { ready, isAr } = useStudioPage("/people");
  const { myWorkspaces } = useApp();
  const account = useCurrentAccount();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<MemberRole | "">("");
  const [searchKey, setSearchKey] = useState(0);
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const owned = useMemo(
    () => (account ? myWorkspaces.filter((w) => w.ownerAccountId === account.id) : []),
    [myWorkspaces, account]
  );
  const people = useMemo(
    () => (account ? aggregatePeople(owned, account.id, account.email) : []),
    [owned, account]
  );
  const shown = useMemo(() => filterPeople(people, query, role), [people, query, role]);
  const filtered = query.trim() !== "" || role !== "";

  // By email, so the sheet follows the person as their brands change.
  const open: Person | null = people.find((p) => p.email === openEmail) ?? null;

  return {
    ready: ready && !!account,
    isAr,
    owned,
    people,
    shown,
    query,
    setQuery,
    role,
    setRole,
    filtered,
    searchKey,
    clearFilters: () => {
      setQuery("");
      setRole("");
      setSearchKey((k) => k + 1);
    },
    open,
    openPerson: (p: Person) => setOpenEmail(p.email),
    closePerson: () => setOpenEmail(null),
  };
}

export type PeoplePage = ReturnType<typeof usePeoplePage>;
