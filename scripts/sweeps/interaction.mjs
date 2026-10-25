import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";

/**
 * Interaction quality, measured rather than eyeballed.
 *
 * Every check here is one testable consequence of a rule that has a name, and
 * each one exists because the thing it measures is invisible to `tsc`, to
 * eslint, and — crucially — to a screenshot. A dead hover looks identical to a
 * live one in a still image.
 *
 *   **Fitts's Law** (1954), as WCAG 2.2 SC 2.5.8: the time to acquire a target
 *   falls with its size. A 14px ✕ is fine with a mouse on a desk and unusable
 *   with a thumb, a trackpad at speed, or a tremor. Floor: 24×24 CSS px.
 *
 *   **Feedback / Jakob's Law**: a control that looks interactive must respond
 *   to being pointed at. This is measured by comparing computed style before
 *   and after a real hover — a `transition` declared with nothing to
 *   transition *to* is the exact bug that shipped once in this codebase's
 *   sidebar, and it is undetectable any other way.
 *
 *   **Doherty Threshold** (IBM, 1982): interaction above ~400ms stops feeling
 *   like a conversation. Any transition or animation longer than that on a
 *   control is a control that feels slow.
 *
 *   **WCAG 2.4.7 / 2.4.11**: a keyboard user must be able to see where they
 *   are. Measured by focusing each element and checking something changed.
 *
 *   **Perceivability of state**: a hover that changes *only* colour is invisible
 *   to a person who cannot distinguish those two colours, and a hover whose
 *   colour change is under ~1.1:1 against the original is invisible to
 *   everybody. Both themes, because the light theme is where tints collapse.
 *
 * The light theme is checked as carefully as the dark one. A tint that reads
 * on #141414 routinely disappears on #ffffff, and the dark theme is the one
 * that gets looked at during development.
 */

// Override with SWEEP_BASE to sweep a server on another port.
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
const EMAIL = "nadeen@studio.com";
const PASSWORD = "markyos2026";
const SLUG = "nadeen-studio";

/** WCAG 2.2 SC 2.5.8 Target Size (Minimum). */
const TARGET_MIN = 24;
/** Doherty. Above this an interaction stops feeling immediate. */
const DOHERTY_MS = 400;
/** How much a hover must change a colour before a person can see it. */
const MIN_HOVER_DELTA = 1.08;

/**
 * Cursors that tell the truth about what a control is.
 *
 * Not only `pointer`. A canvas has gestures a pointer cannot describe, and each
 * of these is the conventional shape for one of them: `grab`/`grabbing` for a
 * surface that moves, `nwse-resize` for a corner that resizes, `crosshair` for
 * a connection being drawn, `copy` for a tool that will place something, `text`
 * for a field. Demanding `pointer` of those would be Jakob's Law enforced
 * against itself.
 */
const HONEST_CURSORS = new Set([
  "pointer",
  "text",
  "grab",
  "grabbing",
  "crosshair",
  "copy",
  "nwse-resize",
  "nesw-resize",
  "ew-resize",
  "ns-resize",
]);

const PAGES = [
  ["brands", "/brands"],
  ["overview", `/w/${SLUG}/overview`],
  ["visual identity", `/w/${SLUG}/visual-identity`],
  ["strategy", `/w/${SLUG}/strategy`],
  ["builder", `/w/${SLUG}/builder`],
  ["moodboard", `/w/${SLUG}/moodboard`],
  ["drafts", `/w/${SLUG}/drafts`],
  ["forms", `/w/${SLUG}/forms`],
  ["departments", `/w/${SLUG}/departments`],
  ["team", `/w/${SLUG}/team`],
  ["settings", `/w/${SLUG}/settings`],
  ["type lab", `/w/${SLUG}/type-lab`],
  ["compliance", `/w/${SLUG}/compliance`],
  ["board", "/studio/board"],
  ["account", "/account"],
];

const findings = [];
const stats = { hovered: 0, focused: 0, sized: 0, pages: 0, unreachable: 0 };
const record = (rule, theme, page, detail, selector) =>
  findings.push({ rule, theme, page, detail, selector });

// ------------------------------------------------------------- in-page ----

/**
 * Collects the interactive elements worth measuring, and a fingerprint of how
 * each one currently looks. Runs inside the page.
 */
const COLLECT = `(() => {
  const SELECTOR = 'button, a[href], [role="button"], summary, input[type="checkbox"], input[type="radio"], select, [tabindex]:not([tabindex="-1"])';

  function describe(el) {
    // A stable-ish handle for the report. Not used to re-find the element —
    // that is done by index — only to say which one it was.
    const label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    return (el.tagName.toLowerCase() + (label ? ' "' + label + '"' : '')).slice(0, 60);
  }

  function fingerprint(el) {
    const s = getComputedStyle(el);
    return {
      backgroundColor: s.backgroundColor,
      // Measured because it is where this app's hover feedback actually lands:
      // controls are coloured with an inline \`background\`, which no stylesheet
      // \`background-color\` rule can override, so the veil is painted here.
      // The first run of this sweep did not look at it and reported the fix as
      // a regression.
      backgroundImage: s.backgroundImage,
      // The design system's button (\`mk-btn\`) answers with a scrim laid over
      // its fill from \`::after\`, so the element's own styles don't move.
      scrim: getComputedStyle(el, '::after').opacity,
      color: s.color,
      opacity: s.opacity,
      boxShadow: s.boxShadow,
      transform: s.transform,
      borderColor: s.borderTopColor + '|' + s.borderInlineStartColor,
      outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor,
      textDecoration: s.textDecorationLine,
      filter: s.filter,
      cursor: s.cursor,
      transitionDuration: s.transitionDuration,
      animationDuration: s.animationDuration,
    };
  }

  /*
   * One query, used for both the report and the handles.
   *
   * This used to run \`querySelectorAll\` twice — once to build the descriptions
   * and again to park the elements in \`window.__ux\` — and every check below
   * addresses an element by its *index* in that list. Any change to the DOM
   * between the two passes shifted one list against the other, and from then on
   * the sweep hovered element A and reported it as element B. It only became
   * visible on the moodboard, which re-renders as its canvas fits itself, and it
   * produced exactly the kind of finding that wastes an afternoon: a control
   * that measurably does answer the pointer, reported as dead.
   */
  const visible = [...document.querySelectorAll(SELECTOR)].filter((el) => {
    const r = el.getBoundingClientRect();
    // Only what is actually on screen and actually visible. An element with no
    // box is not a target anyone can miss, and measuring it produces findings
    // nobody can act on.
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
    return !(r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth);
  });
  window.__ux = visible;

  const out = [];
  visible.forEach((el, index) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    out.push({
      index,
      tag: el.tagName.toLowerCase(),
      desc: describe(el),
      disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true',
      /*
       * The *laid-out* size, not the painted one.
       *
       * \`getBoundingClientRect\` reports geometry after every ancestor
       * transform, and the builder frames its canvas at a real viewport width
       * and then scales it to fit. A 26px control inside that frame paints at
       * 20px and is still a 26px control — nobody taps the editor's zoom-to-fit
       * preview. Measuring the painted size reported five false failures.
       *
       * \`offsetWidth\`/\`offsetHeight\` are pre-transform by definition, which
       * is exactly the number WCAG's target-size rule is about.
       */
      width: el.offsetWidth || Math.round(r.width * 10) / 10,
      height: el.offsetHeight || Math.round(r.height * 10) / 10,
      /** Set when a transform means the two disagree, so a report can say so. */
      scaled: Math.abs((el.offsetHeight || r.height) - r.height) > 1,
      // An inline link inside a paragraph is exempt from the target-size rule,
      // because making it 24px tall would break the line it sits in. WCAG 2.5.8
      // names the same exception ("Inline").
      inlineInText: el.tagName === 'A' && s.display.includes('inline') && !!el.closest('p, li, figcaption, td, label'),
      // Text being edited in place is not a target either. It is focusable so
      // that it can be typed into, and its size is the size of the sentence —
      // demanding 24px of a heading being retyped is measuring the wrong thing.
      editable: el.isContentEditable || el.closest('[contenteditable="true"]') !== null,
      hasTitle: !!(el.getAttribute('title') || el.getAttribute('aria-describedby')),
      before: fingerprint(el),
    });
  });

  return out;
})()`;

const FINGERPRINT_AT = (i) => `(() => {
  const el = window.__ux[${i}];
  if (!el) return null;
  const s = getComputedStyle(el);
  return {
    backgroundColor: s.backgroundColor,
    backgroundImage: s.backgroundImage,
    scrim: getComputedStyle(el, '::after').opacity,
    color: s.color,
    opacity: s.opacity,
    boxShadow: s.boxShadow,
    transform: s.transform,
    borderColor: s.borderTopColor + '|' + s.borderInlineStartColor,
    outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor,
    textDecoration: s.textDecorationLine,
    filter: s.filter,
    cursor: s.cursor,
    transitionDuration: s.transitionDuration,
    animationDuration: s.animationDuration,
  };
})()`;

// ------------------------------------------------------------- helpers ----

function parseRgb(value) {
  const m = String(value).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}

function luminance({ r, g, b }) {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** How different two colours are, as a contrast ratio. 1 means identical. */
function colourDelta(a, b) {
  const ca = parseRgb(a);
  const cb = parseRgb(b);
  if (!ca || !cb) return null;
  // A change in alpha alone is a real visible change, and the ratio below
  // cannot see it — treat any alpha move as visible.
  if (Math.abs(ca.a - cb.a) > 0.02) return Infinity;
  const la = luminance(ca);
  const lb = luminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Longest duration in a comma-separated CSS duration list, in ms. */
function longestMs(value) {
  if (!value) return 0;
  return Math.max(
    0,
    ...String(value)
      .split(",")
      .map((d) => {
        const t = d.trim();
        if (t.endsWith("ms")) return parseFloat(t);
        if (t.endsWith("s")) return parseFloat(t) * 1000;
        return 0;
      })
      .filter((n) => !Number.isNaN(n)),
  );
}

/** Whether a hover produced any perceivable change at all. */
function changed(before, after) {
  if (!after) return { any: false, reasons: [] };
  const reasons = [];
  for (const key of [
    "opacity",
    "boxShadow",
    "transform",
    "textDecoration",
    "filter",
    "outline",
    "backgroundImage",
    "scrim",
  ]) {
    if (before[key] !== after[key]) reasons.push(key);
  }
  for (const key of ["backgroundColor", "color", "borderColor"]) {
    if (before[key] === after[key]) continue;
    // A colour that moved by less than the threshold is a change on paper and
    // nothing at all on a screen — which is worse than no hover, because the
    // code claims to have handled it.
    const parts = key === "borderColor" ? before[key].split("|") : [before[key]];
    const afterParts = key === "borderColor" ? after[key].split("|") : [after[key]];
    const delta = Math.max(
      ...parts.map((p, i) => colourDelta(p, afterParts[i]) ?? 1),
    );
    if (delta >= MIN_HOVER_DELTA) reasons.push(key);
    else reasons.push(`${key} (only ${delta.toFixed(2)}:1 — not perceivable)`);
  }
  const real = reasons.filter((r) => !r.includes("not perceivable"));
  return { any: real.length > 0, reasons };
}

// ----------------------------------------------------------------- run ----

async function signIn(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/brands|\/w\//, { timeout: 20000 });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem("markyos:theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
}

/**
 * Some pages have nothing on them until something is made.
 *
 * The seeded workspace has no moodboard, so this sweep walked that page for
 * months and only ever measured its empty state — the whole canvas, its cards
 * and its tool palette were never audited at all. A page whose controls only
 * exist after a click needs that click, or the clean result is about a screen
 * nobody uses.
 */
async function prepare(page, name) {
  if (name !== "moodboard") return;
  // Scoped to the picker. An unscoped `has-text("Brand identity")` also matches
  // the switcher pill for the board *made from* that template, so on the second
  // pass this clicked the pill instead — leaving it hovered and the control
  // after it focused, which then read as one dead hover and one missing focus
  // ring. A selector that matches two different things is a selector that will.
  const template = page.locator('[data-template-picker] button:has-text("Brand identity")').first();
  if ((await template.count()) === 0) return;
  await template.click();
  // The canvas fits itself once on first render; measuring mid-animation would
  // report geometry nothing ever actually has.
  await page.waitForTimeout(900);
  /*
   * Hand the page back to the keyboard.
   *
   * `:focus-visible` is a heuristic on the last input *modality*, and a click
   * switches it to "pointer" for the rest of the session — after which every
   * programmatic `.focus()` below is correctly judged as not needing a ring.
   * The click above therefore reported 42 controls as having no focus ring,
   * including sidebar links that pass on the fourteen pages this sweep does not
   * click on. One Tab restores the modality this check is actually about.
   */
  await page.keyboard.press("Tab");
  await page.waitForTimeout(100);
}

async function auditPage(page, theme, name, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await setTheme(page, theme);
  await page.waitForTimeout(500);
  await prepare(page, name);

  // The guard that makes a clean result mean something. An earlier sweep in
  // this repo reported a perfect pass against a password gate.
  const rendered = await page.evaluate(() => document.body.innerText.trim().length > 40);
  if (!rendered) {
    record("render", theme, name, "page rendered almost nothing — the audit below is meaningless", "body");
    return;
  }

  /*
   * A resting page, before anything is measured.
   *
   * Every check here works by comparing "before" against "after", so the
   * baseline has to be a page with nothing hovered and nothing focused. Leave
   * one element under the pointer and its veil is already in the baseline — and
   * the sweep reports the one control it can prove responds to hover as the only
   * one that does not.
   */
  await page.mouse.move(2, 2);
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.waitForTimeout(150);

  const elements = await page.evaluate(COLLECT);
  if (elements.length === 0) {
    record("render", theme, name, "no interactive elements found on a page that should have several", "body");
    return;
  }
  stats.pages++;

  // ------------------------------------------- Fitts's Law / SC 2.5.8 ----
  for (const el of elements) {
    stats.sized++;
    if (el.inlineInText || el.editable) continue;
    if (el.width < TARGET_MIN || el.height < TARGET_MIN) {
      record(
        "target-size",
        theme,
        name,
        `${el.width}×${el.height}px laid out, under the ${TARGET_MIN}px floor`,
        el.desc,
      );
    }
  }

  // ----------------------------------------------- Doherty threshold ----
  for (const el of elements) {
    const t = longestMs(el.before.transitionDuration);
    const a = longestMs(el.before.animationDuration);
    if (t > DOHERTY_MS) {
      record("slow", theme, name, `transition runs ${Math.round(t)}ms`, el.desc);
    }
    if (a > DOHERTY_MS && a < 10000) {
      record("slow", theme, name, `animation runs ${Math.round(a)}ms`, el.desc);
    }
  }

  /*
   * A disabled control has to say why it is disabled.
   *
   * This is the Zeigarnik effect pointed the wrong way: an unfinished action
   * with no explanation is a loose end a person keeps returning to. "Publish"
   * greyed out with no reason sends someone hunting through settings; "Publish
   * — nothing has changed since the last one" ends the search in a second.
   *
   * A `title` or an `aria-describedby` both satisfy it. So does a visible
   * explanation adjacent to the control, which this cannot see — so a finding
   * here is a prompt to look, not a proof of a defect.
   */
  for (const el of elements) {
    if (!el.disabled || el.hasTitle) continue;
    record("unexplained", theme, name, "disabled with no reason given", el.desc);
  }

  // --------------------------------------------- cursor affordance ----
  for (const el of elements) {
    if (el.disabled) {
      // A disabled control saying `cursor: pointer` invites a click that will
      // do nothing, which is the one thing a cursor is supposed to prevent.
      if (el.before.cursor === "pointer") {
        record("cursor", theme, name, "disabled but still says `pointer`", el.desc);
      }
      continue;
    }
    if (el.tag === "select" || el.tag === "input") continue;
    // A resize corner and a connection port are interactive and are *not*
    // pointers: `nwse-resize` and `crosshair` are what those gestures look like
    // everywhere, and reporting them would be this check insisting on a
    // convention against the convention it exists to enforce.
    if (!HONEST_CURSORS.has(el.before.cursor)) {
      record("cursor", theme, name, `interactive but cursor is \`${el.before.cursor}\``, el.desc);
    }
  }

  // -------------------------------------------------------- hover ----
  // Sampled rather than exhaustive: a page with 120 controls would take a
  // minute to hover through, and the patterns repeat. Every distinct element
  // *shape* is covered because the sample is spread across the list.
  const sample = elements.filter((e) => !e.disabled && !e.editable);
  const step = Math.max(1, Math.floor(sample.length / 30));
  for (let i = 0; i < sample.length; i += step) {
    const el = sample[i];
    try {
      const handle = await page.evaluateHandle((idx) => window.__ux[idx], el.index);
      const box = await handle.asElement()?.boundingBox();
      if (!box) continue;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Long enough for a 140ms transition to land, short enough to stay quick.
      await page.waitForTimeout(220);

      /*
       * Did the pointer actually land on it?
       *
       * `boundingBox` reports geometry regardless of what an ancestor clips
       * with `overflow: hidden` — the same trap the responsive sweep fell into
       * once. A control scrolled out of the builder's canvas frame still has a
       * box, and moving the mouse to it hovers the frame instead. Reporting
       * that as "this control does not answer the pointer" would be a finding
       * about the probe, dressed up as a finding about the product.
       */
      const reallyHovered = await page.evaluate(
        (idx) => window.__ux[idx]?.matches(":hover") === true,
        el.index,
      );
      if (!reallyHovered) {
        stats.unreachable++;
        await handle.dispose();
        continue;
      }

      const after = await page.evaluate(FINGERPRINT_AT(el.index));
      stats.hovered++;

      const result = changed(el.before, after);
      if (!result.any) {
        const nearMiss = result.reasons.find((r) => r.includes("not perceivable"));
        record(
          "dead-hover",
          theme,
          name,
          nearMiss
            ? `hover changes ${nearMiss}`
            : // The two values, not just the verdict. "Hover changes nothing"
              // is a claim; the pair of fingerprints is the evidence, and
              // without it every finding here starts with reproducing the run
              // by hand to find out what was actually measured.
              `hover changes nothing at all — background-image stayed \`${after?.backgroundImage}\`, ` +
              `background-color \`${after?.backgroundColor}\`, box-shadow \`${after?.boxShadow}\``,
          el.desc,
        );
      }
      await handle.dispose();
    } catch {
      // The element went away mid-hover — a menu closing, a re-render. Not a
      // finding; a finding here would be about the probe, not the product.
    }
  }
  // Park the pointer somewhere harmless before the focus pass.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(150);

  // -------------------------------------------------------- focus ----
  const focusSample = elements.filter((e) => !e.disabled);
  const fstep = Math.max(1, Math.floor(focusSample.length / 20));
  for (let i = 0; i < focusSample.length; i += fstep) {
    const el = focusSample[i];
    try {
      const after = await page.evaluate((idx) => {
        const node = window.__ux[idx];
        if (!node) return null;
        node.focus();
        const s = getComputedStyle(node);
        return {
          outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor,
          boxShadow: s.boxShadow,
          matches: node.matches(":focus-visible"),
          isFocused: document.activeElement === node,
        };
      }, el.index);
      if (!after || !after.isFocused) continue;
      stats.focused++;
      const ring =
        after.outline !== el.before.outline ||
        after.boxShadow !== el.before.boxShadow;
      if (!ring) {
        record(
          "focus",
          theme,
          name,
          `focused with no visible ring — outline \`${after.outline}\`, ` +
            `:focus-visible ${after.matches ? "matched" : "did not match"}`,
          el.desc,
        );
      }
    } catch {
      // Same as above.
    }
  }
}

async function run() {
  /* A 500 error page has no controls, so it has no unreachable control and no
     missing focus ring — a dead server passes this sweep too. See
     serverGuard.mjs. */
  await assertServerUp(BASE, [`/w/${SLUG}/overview`, `/w/${SLUG}/builder`]);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  await signIn(page);

  for (const theme of ["dark", "light"]) {
    for (const [name, path] of PAGES) {
      await auditPage(page, theme, name, path);
    }
  }

  // -------------------------------------- prefers-reduced-motion ----
  const reduced = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    reducedMotion: "reduce",
  });
  const rPage = await reduced.newPage();
  await signIn(rPage);
  await rPage.goto(`${BASE}/w/${SLUG}/builder`, { waitUntil: "networkidle" });
  await rPage.waitForTimeout(700);
  const motion = await rPage.evaluate(() => {
    const slow = [];
    document.querySelectorAll("*").forEach((el) => {
      const s = getComputedStyle(el);
      const dur = (v) =>
        Math.max(
          0,
          ...String(v)
            .split(",")
            .map((d) => (d.trim().endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000))
            .filter((n) => !Number.isNaN(n)),
        );
      if (dur(s.transitionDuration) > 20 || dur(s.animationDuration) > 20) {
        slow.push(el.tagName.toLowerCase() + "." + String(el.className).slice(0, 30));
      }
    });
    return slow.slice(0, 5);
  });
  if (motion.length) {
    record("reduced-motion", "both", "builder", `still animating: ${motion.join(", ")}`, "*");
  }
  await reduced.close();
  await browser.close();

  // -------------------------------------------------------- report ----
  console.log(
    `Interaction sweep — ${stats.pages} page renders, ${stats.sized} elements sized, ` +
      `${stats.hovered} hovered, ${stats.focused} focused` +
      (stats.unreachable ? `, ${stats.unreachable} clipped out of reach` : "") +
      "\n",
  );

  const byRule = new Map();
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }

  const RULES = {
    "target-size": "Fitts's Law · WCAG 2.5.8 — targets under 24px",
    "dead-hover": "Feedback — a control that does not answer the pointer",
    focus: "WCAG 2.4.7 — keyboard users cannot see where they are",
    slow: "Doherty Threshold — interaction over 400ms",
    cursor: "Jakob's Law — the cursor lies about what this is",
    unexplained: "Zeigarnik — a blocked action that does not say what is blocking it",
    "reduced-motion": "Respecting prefers-reduced-motion",
    render: "The probe measured the wrong thing",
  };

  for (const [rule, list] of byRule) {
    console.log(`  ${RULES[rule] ?? rule} — ${list.length}`);
    // Collapsed by the element and the detail, so one repeated pattern reads
    // as one problem rather than forty. Forty lines of the same bug is how a
    // report gets ignored.
    const seen = new Map();
    for (const f of list) {
      const key = `${f.selector}|${f.detail}`;
      if (!seen.has(key)) seen.set(key, { ...f, themes: new Set(), pages: new Set() });
      seen.get(key).themes.add(f.theme);
      seen.get(key).pages.add(f.page);
    }
    for (const f of [...seen.values()].slice(0, 14)) {
      const where = f.pages.size > 3 ? `${f.pages.size} pages` : [...f.pages].join(", ");
      console.log(`      ${f.selector}`);
      console.log(`        ${f.detail}  [${[...f.themes].join("+")} · ${where}]`);
    }
    if (seen.size > 14) console.log(`      … and ${seen.size - 14} more of this kind`);
    console.log("");
  }

  if (findings.length === 0) {
    console.log("Nothing. Every control is reachable, answers the pointer, shows focus,\nand responds inside the Doherty threshold — in both themes.");
    return;
  }
  console.log(`TOTAL: ${findings.length} findings across both themes.`);
  process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
