// Public API of the people feature. Code outside features/people/
// imports from "./", never from a file inside it.

export { PeopleView } from "./components/people-view";
export { usePeoplePage } from "./hooks/use-people-page";
