"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Motion for the client-facing guideline site.
 *
 * The app's own rule is that nothing animates purely for decoration — on a tool
 * people use all day, motion that carries no meaning becomes latency. This is
 * the other surface, and the rule lands differently on it: a guideline site is
 * a thing a studio *presents*, read once or twice, top to bottom. Here motion
 * is what paces the reading and says a section has arrived. A ten-thousand
 * pixel document that drops fully formed in one paint has no pacing at all.
 *
 * Mounted only by the two `/v/<slug>` routes, never by the builder's canvas.
 * The same templates render inside the editor, where sections fading past while
 * somebody is trying to click a line of text would be the opposite of helpful —
 * and where the canvas clips its own scroll, so an observer watching the
 * viewport would never fire for most of the page.
 */
export function GuidelineMotion({
  sectionIds,
}: {
  /**
   * The ids to reveal, from the viewer's own section list.
   *
   * Passed in rather than guessed from the DOM: the six templates do not agree
   * on what element a section is, and a selector that has to match all of them
   * would be wrong the first time a seventh is added.
   */
  sectionIds: string[];
}) {
  return (
    <>
      <ScrollProgress />
      <SectionReveal ids={sectionIds} />
    </>
  );
}

/**
 * How far through the document you are.
 *
 * Earns its place on this surface specifically: a brand guideline is long, has
 * no pagination, and is often read to decide whether the thing you need is in
 * it. A scrollbar says the same thing, but browsers increasingly hide it until
 * you move, and it is the browser's chrome rather than the document's.
 *
 * Painted with `transform: scaleX`, so it costs a composite and never a layout.
 */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const doc = document.scrollingElement;
      if (!doc) return;
      const span = doc.scrollHeight - doc.clientHeight;
      el.style.transform = `scaleX(${span > 0 ? Math.min(1, doc.scrollTop / span) : 0})`;
    }
    function onScroll() {
      // One update per frame however many scroll events arrive. A scroll
      // handler that writes a style per event is the classic way to make a long
      // page feel heavy, which is the opposite of the point here.
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="g-progress-track"
      /* Not a `progressbar` role: this reports the viewport's position in a
         document, which a screen reader already conveys, and announcing it on
         every scroll would be noise. It is decoration for the eye only. */
    >
      <div ref={ref} className="g-progress-bar" />
    </div>
  );
}

/** How far apart consecutive cards arrive, and the most any one may wait. */
const STAGGER_STEP_MS = 55;
const STAGGER_CAP_MS = 330;

/**
 * The cards inside a section, marked so they can arrive one after another.
 *
 * The rule is drawn from what the templates actually emit rather than from
 * class names, which differ in all six of them. A real card grid is a
 * `display: grid` whose children are all the same element — logo tiles, misuse
 * tiles, colour swatches, persona cards. The thing this has to avoid staggering
 * is a heading row, and those turn out to be `display: flex` with two children
 * of mixed purpose, so the grid test excludes them by construction.
 *
 * Nested grids are skipped once an ancestor has been claimed: otherwise the
 * delays compound and the innermost card waits for a second and a half.
 */
function claimCards(section: HTMLElement): HTMLElement[] {
  const claimedGrids: HTMLElement[] = [];
  const marked: HTMLElement[] = [];

  for (const el of Array.from(section.querySelectorAll<HTMLElement>("*"))) {
    const kids = Array.from(el.children) as HTMLElement[];
    if (kids.length < 2 || kids.length > 24) continue;
    if (getComputedStyle(el).display !== "grid") continue;
    if (new Set(kids.map((k) => k.tagName)).size !== 1) continue;
    if (claimedGrids.some((g) => g.contains(el))) continue;

    claimedGrids.push(el);
    kids.forEach((kid, i) => {
      kid.style.setProperty("--reveal-delay", `${Math.min(i * STAGGER_STEP_MS, STAGGER_CAP_MS)}ms`);
      kid.dataset.revealItem = "";
      marked.push(kid);
    });
  }
  return marked;
}

/**
 * Sections arrive as they are reached.
 *
 * Fail-open by construction. The script *claims* an element by setting
 * `data-reveal="pending"`, and only a claimed element is ever hidden — so if
 * this component never runs, or the selector finds nothing, or the browser has
 * no IntersectionObserver, every section renders exactly as it does today. The
 * failure mode of a decoration must never be invisible content.
 */
function SectionReveal({ ids }: { ids: string[] }) {
  /*
   * The dependency is the joined string, and the effect reads the ids back out
   * of it rather than closing over the array.
   *
   * `sectionIds` is built with `.map()` in the viewer's render, so it is a new
   * array every time — and the viewer re-renders on every scroll, because the
   * scroll-spy tracks which section is active. Depending on the array meant
   * this effect tore itself down and rebuilt on every scroll event: the
   * observer was disconnected, every `data-reveal` attribute was deleted, and
   * the whole thing was set up again a frame later. It is also what made the
   * probe report no claimed sections at all.
   */
  const key = ids.join(",");

  // Before paint, not after. Claiming the sections in a passive effect would
  // let the browser paint them once at full opacity first, so the page would
  // flash its whole self and then hide most of it to animate back in.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    // Asked not to be moved: this is a decoration and there is nothing to
    // degrade to. Sections simply stay where they are.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = key
      .split(",")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    // Anything already on screen is left alone. Fading in what somebody is
    // already looking at is the cheap version of this effect, and on a cover
    // that fills the window it would mean the page appearing to load twice.
    const pending: HTMLElement[] = [];
    const items: HTMLElement[] = [];
    for (const el of els) {
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.9) continue;
      el.dataset.reveal = "pending";
      pending.push(el);
      // Claimed now rather than at reveal time: an element that starts visible
      // and is hidden the instant its section arrives would pop before it
      // animated.
      const staggered = claimCards(el);
      if (staggered.length > 0) {
        el.dataset.revealItems = "";
        items.push(...staggered);
      }
    }
    if (pending.length === 0) return;

    // Set by the observer's very first callback, which fires for every target
    // on the next frame whether or not it is on screen. It answers "is this
    // mechanism working", which is the only thing the fallback below needs to
    // know — and is not the same question as "has anything been revealed yet",
    // which is false for a whole minute if somebody simply has not scrolled.
    let observerAlive = false;

    const reveal = (el: HTMLElement) => {
      el.dataset.reveal = "in";
    };

    const io = new IntersectionObserver(
      (entries) => {
        observerAlive = true;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          reveal(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      },
      // Fires a little before the section's leading edge reaches the fold, so
      // the movement finishes about when the eye arrives rather than starting
      // there. `threshold: 0` because a tall section may never have a large
      // fraction of itself on screen at once.
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    for (const el of pending) io.observe(el);

    const revealAll = () => {
      for (const el of pending) if (el.dataset.reveal === "pending") reveal(el);
    };

    /*
     * If the mechanism is not working, show everything.
     *
     * Only that. An earlier version revealed every pending section on a plain
     * two-second timer, which meant the whole page quietly un-hid itself before
     * anybody had scrolled — the animation was never seen, and the probe that
     * was supposed to prove it worked reported zero sections pending and looked
     * like a pass.
     */
    const failSafe = window.setTimeout(() => {
      if (observerAlive) return;
      revealAll();
    }, 2500);

    // Printing is the other way a page is consumed all at once. A guideline
    // printed with two thirds of its sections at zero opacity would be a
    // decoration destroying the deliverable.
    window.addEventListener("beforeprint", revealAll);

    return () => {
      io.disconnect();
      window.clearTimeout(failSafe);
      window.removeEventListener("beforeprint", revealAll);
      // Hand every element back exactly as it was found.
      for (const el of pending) {
        delete el.dataset.reveal;
        delete el.dataset.revealItems;
      }
      for (const el of items) {
        delete el.dataset.revealItem;
        el.style.removeProperty("--reveal-delay");
      }
    };
  }, [key]);

  return null;
}
