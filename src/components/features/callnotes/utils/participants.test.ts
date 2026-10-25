import { describe, expect, it } from "vitest";
import { guessRole, mergeParticipants } from "../components/ParticipantsEditor";
import type { TeamMember } from "@/types";

const team: TeamMember[] = [
  { id: "1", name: "Omar Aziz", email: "omar@client.sa", role: "client" },
  { id: "2", name: "Layla Haddad", email: "layla@studio.com", role: "editor" },
];

describe("guessRole", () => {
  it("reads the side from a team member's first name", () => {
    expect(guessRole("Omar", team)).toBe("client");
    expect(guessRole("Layla", team)).toBe("studio");
  });

  it("assumes the client for anyone unknown", () => {
    expect(guessRole("Speaker 2", team)).toBe("client");
  });
});

describe("mergeParticipants", () => {
  it("keeps the mapped speaker over a hand-added duplicate and drops empty rows", () => {
    expect(
      mergeParticipants([
        { name: "Omar Aziz", role: "client" },
        { name: " ", role: "client" },
        { name: "Omar Aziz ", role: "client", label: "Omar" },
        { name: "Nour Haddad", role: "studio" },
      ])
    ).toEqual([
      { name: "Omar Aziz", role: "client", label: "Omar" },
      { name: "Nour Haddad", role: "studio" },
    ]);
  });
});
