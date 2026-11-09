/**
 * The collapsible sidebars and where each remembers being collapsed.
 *
 * Read twice: by the sidebar itself (through `useLocalPref`), and before
 * first paint by {@link SIDEBAR_INIT_SCRIPT}, which marks <html> so a rail
 * that was collapsed is drawn collapsed from the very first frame — no page
 * load opens it and then animates it shut.
 */
export const SIDEBAR_RAILS = {
  studio: "markyos:ui:sidebar-collapsed",
  admin: "markyos:ui:admin-sidebar-collapsed",
} as const;

export type SidebarRail = keyof typeof SIDEBAR_RAILS;

export const SIDEBAR_INIT_SCRIPT = `(function(){try{var r=${JSON.stringify(SIDEBAR_RAILS)},c=[];for(var n in r){if(localStorage.getItem(r[n])==="true")c.push(n);}if(c.length)document.documentElement.setAttribute("data-rails-collapsed",c.join(" "));}catch(e){}})();`;
