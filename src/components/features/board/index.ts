// Public API of the board feature. Code outside features/board/
// imports from "@/components/features/board", never from a file inside it.
export { BoardHeader } from "./components/BoardHeader";
export { BoardView } from "./components/BoardView";
export { useBoardPage } from "./hooks/useBoardPage";
