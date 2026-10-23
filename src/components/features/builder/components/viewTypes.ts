import type { Breakpoint } from "@/lib/doc/core/types";
import type { Lang } from "@/types";

/**
 * Re-exported so the builder's components import their view vocabulary from
 * one place rather than reaching across two modules for two halves of the same
 * idea. `Breakpoint` comes from the document core because the CSS emitter and
 * the sweep have to agree with the editor about what "phone" means.
 */
export type { Breakpoint, Lang };

/** Where the builder's canvas is, and what it is allowed to change there. */
export type BuilderView = { breakpoint: Breakpoint; lang: Lang };
