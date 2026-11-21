// Public API of the team feature. Code outside features/team/
// imports from "./", never from a file inside it.
export { TeamView } from "./components/team-view";
// Saved versions are shown on Settings → Activity; the team page keeps the people.
export { VersionHistorySection } from "./components/history/version-history-section";
export { useTeamPage } from "./hooks/use-team-page";
