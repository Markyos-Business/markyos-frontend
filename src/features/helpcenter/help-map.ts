/*
 * Which Help Center article each screen's ? button opens (in-app entry point).
 *
 * One place, so the content team and developers change it together. The
 * value is the article's slug in either language (English is simplest); the
 * panel shows it in the reader's language, or in the language it has with a
 * note when it isn't translated. A slug with no published article opens the
 * panel's search instead, so a missing article is never a dead end.
 *
 * Adding a screen: add a key here, then put <HelpButton screen="…" /> in that
 * screen's header.
 */
export const HELP_SCREENS = {
  "brand.overview": "tour-of-the-workspace",
  "brand.discovery": "send-a-questionnaire",
  "brand.callNotes": "add-call-notes",
  "brand.analysis": "read-the-brief-analysis",
  "brand.assets": "upload-assets",
  "brand.team": "invite-people",
  "brand.settings": "change-your-plan",
} as const;

export type HelpScreen = keyof typeof HELP_SCREENS;
