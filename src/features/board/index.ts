// Public API of the board feature. Code outside features/board/
// imports from "./", never from a file inside it.
export { BoardHeader } from "./components/board-header";
export { BoardView } from "./components/board-view";
export { useBoardPage } from "./hooks/use-board-page";
