// Public API of the moodboard feature. Code outside features/moodboard/
// imports from "@/features/moodboard", never from a file inside it.
export { Canvas } from "./components/board/canvas";
export { MoodboardView } from "./components/board/moodboard-view";
export { Zone } from "./components/board/zone";
export type { ZoneAction } from "./components/board/zone";
export { useMoodboardPage } from "./hooks/board/use-moodboard-page";
export { MoodboardProjectsView } from "./components/projects/moodboard-projects-view";
export { useMoodboardProjectsPage } from "./hooks/projects/use-moodboard-projects-page";
export { fileToDownscaledDataUrl } from "./utils/image-downscale";
export { sampleImage } from "./utils/sample-image";
export { MOODBOARD_TEMPLATES } from "./utils/templates";
export { zoneForKind } from "./utils/zones";
