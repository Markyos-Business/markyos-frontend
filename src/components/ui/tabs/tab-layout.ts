/** Reserve the menu first, and pin the active tab while fitting a leading prefix. */
export function fitTabs(widths: readonly number[], available: number, menuWidth: number, activeIndex: number): number[] {
  if (widths.reduce((sum, width) => sum + width + 4, 8) <= available) return widths.map((_, index) => index);
  const budget = Math.max(0, available - menuWidth - 16);
  let used = 0;
  const visible: number[] = [];
  for (let index = 0; index < widths.length; index++) {
    if (used + widths[index] + 4 > budget) break;
    visible.push(index); used += widths[index] + 4;
  }
  if (activeIndex >= 0 && !visible.includes(activeIndex)) {
    while (visible.length && used + widths[activeIndex] + 4 > budget) used -= widths[visible.pop()!] + 4;
    visible.push(activeIndex);
  }
  return visible;
}
export function activeRoute(pathname: string, href: string) {
  const path = href.split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}
