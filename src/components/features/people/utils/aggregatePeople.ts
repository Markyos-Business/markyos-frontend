import type { Workspace } from "@/types";
import type { MemberRole, Person } from "../types";

/**
 * Everyone on the brands `ownerId` owns, one row per person however many
 * brands they're on. The owner isn't listed (they're on every one), and an
 * `owner` entry is ownership, which moves only by transfer.
 */
export function aggregatePeople(workspaces: Workspace[], ownerId: string, ownerEmail: string): Person[] {
  const me = ownerEmail.trim().toLowerCase();
  const people = new Map<string, Person>();
  for (const ws of workspaces) {
    if (ws.ownerAccountId !== ownerId) continue;
    for (const member of ws.team) {
      const email = member.email.trim().toLowerCase();
      if (!email || email === me || member.role === "owner") continue;
      const person = people.get(email) ?? { email, name: "", brands: [] };
      // The first real name wins; an address alone is the fallback.
      if (!person.name && member.name.trim()) person.name = member.name.trim();
      person.brands.push({
        workspaceId: ws.id,
        brandName: ws.name,
        slug: ws.slug,
        memberId: member.id,
        role: member.role as MemberRole,
      });
      people.set(email, person);
    }
  }
  return [...people.values()]
    .map((p) => ({
      ...p,
      name: p.name || p.email.split("@")[0],
      brands: [...p.brands].sort((a, b) => a.brandName.localeCompare(b.brandName)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** People matching a search (name or email) and, optionally, holding `role` on some brand. */
export function filterPeople(people: Person[], query: string, role: MemberRole | ""): Person[] {
  const q = query.trim().toLowerCase();
  return people.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.email.includes(q)) &&
      (!role || p.brands.some((b) => b.role === role))
  );
}
