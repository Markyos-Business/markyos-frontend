/**
 * Scrolls `container` just enough to show `item`, like
 * `scrollIntoView({ block: "nearest", inline: "nearest" })` but without
 * touching any other scroller or the page.
 *
 * Chrome moves the keyboard's starting point to whatever `scrollIntoView`
 * reveals, so calling it on page load made the first Tab skip the skip link
 * and land after the active sidebar item or tab. Setting `scrollTop` and
 * `scrollLeft` on the container leaves that starting point alone.
 */
export function revealInScroller(container: HTMLElement | null, item: HTMLElement | null | undefined) {
  if (!container || !item) return;
  const box = container.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  let dy = 0;
  if (rect.top < box.top) dy = rect.top - box.top;
  else if (rect.bottom > box.bottom) dy = Math.min(rect.bottom - box.bottom, rect.top - box.top);
  let dx = 0;
  if (rect.left < box.left) dx = rect.left - box.left;
  else if (rect.right > box.right) dx = Math.min(rect.right - box.right, rect.left - box.left);
  if (dy) container.scrollTop += dy;
  if (dx) container.scrollLeft += dx;
}
