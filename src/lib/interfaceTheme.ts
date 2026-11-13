/**
 * Theme preferences shared by the server layout and browser provider.
 * Keep this module free of "use client": the inline head script must be
 * serialized as text, never as a suspended client-module reference.
 */
export type ThemeChoice = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "markyos:theme";

/**
 * Runs before first paint, so the page never renders dark and then flips.
 * Kept in sync with ThemeProvider's `applyTheme` — both read the same key and stamp the
 * same attribute.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"system";var d=c==="dark"||(c==="system"&&!window.matchMedia("(prefers-color-scheme: light)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
