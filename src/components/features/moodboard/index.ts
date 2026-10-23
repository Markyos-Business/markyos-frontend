// Public API of the moodboard feature. Code outside features/moodboard/
// imports from "@/features/moodboard", never from a file inside it.
export { Canvas } from "./components/Canvas";
export { Zone } from "./components/Zone";
export type { ZoneAction } from "./components/Zone";
export { fileToDownscaledDataUrl } from "./model/imageDownscale";
export { sampleImage } from "./model/sampleImage";
export { MOODBOARD_TEMPLATES } from "./model/templates";
export { zoneForKind } from "./model/zones";
