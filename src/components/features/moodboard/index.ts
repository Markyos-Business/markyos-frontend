// Public API of the moodboard feature. Code outside features/moodboard/
// imports from "@/features/moodboard", never from a file inside it.
export { Canvas } from "./components/board/Canvas";
export { MoodboardView } from "./components/board/MoodboardView";
export { Zone } from "./components/board/Zone";
export type { ZoneAction } from "./components/board/Zone";
export { useMoodboardPage } from "./hooks/board/useMoodboardPage";
export { MoodboardProjectsView } from "./components/projects/MoodboardProjectsView";
export { useMoodboardProjectsPage } from "./hooks/projects/useMoodboardProjectsPage";
export { fileToDownscaledDataUrl } from "./utils/imageDownscale";
export { sampleImage } from "./utils/sampleImage";
export { MOODBOARD_TEMPLATES } from "./utils/templates";
export { zoneForKind } from "./utils/zones";
