// Public API of the people feature. Code outside features/people/
// imports from "@/components/features/people", never from a file inside it.

export { PeopleView } from "./components/PeopleView";
export { usePeoplePage } from "./hooks/usePeoplePage";
