import { chromium } from "playwright";
import { assertServerUp, installServerGuard } from "./serverGuard.mjs";

const BASE = "http://localhost:3000";
const WS = "nadeen-studio";
const PHONE = { width: 390, height: 844 };

const TEMPLATES = [
  ["vault", null],
  ["docs", null],
  ["studio", "atlas"],
  ["studio", "prism"],
  ["studio", "signal"],
  ["manual", null],
  ["mosaic", null],
  ["deck", null],
];

// Before the browser opens: this run drives /v/<slug>, which is client-rendered
// and needs fresh compilation, so it is exactly the route a dead worker pool
// cannot serve while / and /login still answer 200.
await assertServerUp(BASE, [`/v/${WS}`]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const guard = installServerGuard(page);

// Seed the store once so localStorage exists on this origin.
await page.goto(`${BASE}/login`);
await page.waitForLoadState("networkidle");
await page.fill('input[type="email"]', "nadeen@studio.com");
await page.fill('input[type="password"]', "markyos2026");
await page.click('button[type="submit"]');
await page.waitForURL(/\/brands/, { timeout: 20000 });

/** Point the published workspace at one template, then republish the snapshot. */
async function applyTemplate(kind, style, lang) {
  await page.evaluate(
    ({ kind, style, slug, lang }) => {
      const raw = localStorage.getItem("markyos:v1");
      if (!raw) throw new Error("no store");
      const s = JSON.parse(raw);
      for (const w of s.workspaces || []) {
        if (w.slug !== slug) continue;
        const apply = (t) => {
          if (!t) return;
          t.guidelineTemplate = kind;
          if (style) t.studioStyle = style;
          // The brand's own language, which is what /v/<slug> opens in. Was
          // `lang` before that field was split; the studio's own interface
          // language is a separate, per-person setting and irrelevant here,
          // because this sweep measures the published page.
          t.primaryLocale = lang;
          // This run measures layout, not the gate. Leaving the password on
          // means every template "passes" because the only thing rendered is
          // the 62-element password form.
          if (t.clientAccess) t.clientAccess.passwordEnabled = false;
        };
        apply(w);
        apply(w.published);
      }
      localStorage.setItem("markyos:v1", JSON.stringify(s));
    },
    { kind, style, slug: WS, lang },
  );
}

/**
 * Refuse to report on a page that isn't the guideline. A probe that can
 * silently measure the wrong document is worse than no probe — this run
 * already produced a clean sweep of a password form once.
 */
async function assertGuidelineRendered(name, lang) {
  /* The status check comes first, and that ordering is the whole point.
     A 500 error page has a DOM, so every check below it passes judgement on a
     document the server failed to build — and reports it as "page looks
     empty", which reads like a broken template. Ask the server what it
     actually said before measuring what it drew. */
  guard.check(name);

  const { chars, text, els, arabic, rtl } = await page.evaluate(() => ({
    chars: document.body.innerText.trim().length,
    text: document.body.innerText.trim().slice(0, 120),
    els: document.querySelectorAll("*").length,
    arabic: (document.body.innerText.match(/[؀-ۿ]/g) || []).length,
    rtl: !!document.querySelector('[dir="rtl"]'),
  }));
  // A clean sweep of a page that silently stayed in English would prove
  // nothing about the mirrored layout, which is the half most likely to break.
  if (lang === "ar" && (arabic < 20 || !rtl)) {
    throw new Error(`${name}: asked for Arabic but got ${arabic} Arabic chars, rtl=${rtl}`);
  }
  if (/password-protected|Access password/i.test(text)) {
    throw new Error(`${name}: still behind the password gate`);
  }
  if (chars < 400 || els < 150) {
    throw new Error(`${name}: page looks empty (${chars} chars, ${els} elements): ${text}`);
  }
  return { chars, els };
}

/** Everything that makes a page unusable on a phone, measured not eyeballed. */
const audit = () =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const findings = [];

    const docScroll = document.documentElement.scrollWidth;
    if (docScroll > vw + 1) {
      findings.push({ kind: "page-scroll", detail: `document scrollWidth ${docScroll} > viewport ${vw}` });
    }

    const seen = new Set();
    for (const el of document.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;

      // An element painting past the right edge, or starting off the left.
      const overflowsRight = r.right > vw + 2;
      const startsOffLeft = r.left < -2;
      if (overflowsRight || startsOffLeft) {
        // Only report the outermost offender; children inherit the problem.
        let parentBad = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const pr = p.getBoundingClientRect();
          if (pr.right > vw + 2 || pr.left < -2) { parentBad = true; break; }
        }
        if (parentBad) continue;

        // getBoundingClientRect reports full geometry even when an ancestor
        // clips it, so decorative artwork that deliberately bleeds inside an
        // `overflow: hidden` frame reads as overflow the viewer can never see.
        // If a clipping ancestor already contains the visible edge, skip it.
        let clipped = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const ov = getComputedStyle(p).overflow;
          if (ov === "visible") continue;
          const pr = p.getBoundingClientRect();
          if (pr.right <= vw + 2 && pr.left >= -2) { clipped = true; break; }
        }
        if (clipped) continue;
        const key = `${el.tagName}.${el.className}`.slice(0, 80);
        if (seen.has(key)) continue;
        seen.add(key);
        const chain = [];
        for (let p = el; p && chain.length < 5; p = p.parentElement) {
          chain.push(`${p.tagName.toLowerCase()}${p.id ? "#" + p.id : ""}`);
        }
        findings.push({
          kind: "overflow",
          detail: `<${el.tagName.toLowerCase()}> w=${Math.round(r.width)} left=${Math.round(r.left)} right=${Math.round(r.right)}`,
          cls: (el.className || "").toString().slice(0, 60),
          text: (el.textContent || "").trim().slice(0, 40),
          src: (el.getAttribute && (el.getAttribute("src") || el.getAttribute("alt"))) || "",
          chain: chain.join(" < "),
          xform: getComputedStyle(el).transform.slice(0, 40),
        });
      }
    }
    return { vw, findings: findings.slice(0, 12) };
  });

const VIEWPORTS = [
  ["phone", { width: 390, height: 844 }],
  ["tablet", { width: 768, height: 1024 }],
];

/**
 * Walk the page to the bottom and report anything the reveal left hidden.
 *
 * Scrolled in overlapping steps rather than jumped to the end: an
 * IntersectionObserver that never sees an element in between is exactly the
 * condition being tested for, and a single jump to the footer would skip past
 * most of the document without ever giving it a chance to fire.
 */
async function checkNothingStranded(name) {
  const stuck = await page.evaluate(async () => {
    const doc = document.scrollingElement;
    const step = Math.round(doc.clientHeight * 0.75);
    for (let y = 0; y <= doc.scrollHeight; y += step) {
      doc.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    // Long enough for the slowest staggered card to finish (540ms plus a 330ms
    // maximum delay).
    await new Promise((r) => setTimeout(r, 1100));

    const bad = [];
    for (const el of document.querySelectorAll("[data-reveal], [data-reveal-item]")) {
      if (Number(getComputedStyle(el).opacity) >= 0.99) continue;
      bad.push((el.id || el.tagName) + (el.dataset.revealItem !== undefined ? " (card)" : " (section)"));
    }
    return bad;
  });
  if (stuck.length) {
    console.log(`\n=== ${name} — ${stuck.length} element(s) left invisible by the reveal ===`);
    for (const s of stuck.slice(0, 8)) console.log(`  stranded    ${s}`);
  }
  return stuck.length;
}

let grand = 0;
let checked = 0;
let stranded = 0;
for (const [vpName, vp] of VIEWPORTS) {
  await page.setViewportSize(vp);
  for (const lang of ["en", "ar"]) {
    for (const [kind, style] of TEMPLATES) {
      await applyTemplate(kind, style, lang);
      await page.goto(`${BASE}/v/${WS}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(700);

      const name = `${style ? `${kind}/${style}` : kind} · ${lang} · ${vpName}`;
      const { chars, els } = await assertGuidelineRendered(name, lang);
      const { vw, findings } = await audit();
      checked++;

      /* ------------------------------------------ nothing left invisible ---
         The guideline site reveals its sections, and the cards inside them, as
         they are scrolled to. That is a decoration, and a decoration is not
         allowed to cost a client a section: if an element is claimed and its
         reveal never fires, the page silently ships with a hole in it.

         Run here because this is the only sweep that drives all eight
         templates. The rule that finds the cards is generic — a `display:grid`
         whose children are all the same element — so it has to be proven
         against templates nobody looked at while writing it, not just the one
         that happened to be on screen. */
      stranded += await checkNothingStranded(name);

      if (findings.length) {
        console.log(`\n=== ${name} @ ${vw}px — ${findings.length} findings (${els} els, ${chars} chars) ===`);
        for (const f of findings) {
          console.log(`  ${f.kind.padEnd(12)} ${f.detail}${f.cls ? ` cls="${f.cls}"` : ""}${f.text ? ` "${f.text}"` : ""}`);
          if (f.chain) console.log(`               chain: ${f.chain}`);
          if (f.src) console.log(`               src/alt: ${f.src.slice(0, 70)}`);
        }
      }
      grand += findings.length;
    }
  }
}

console.log(`\n${checked} combinations checked (8 templates × en/ar × phone/tablet)`);
console.log(`TOTAL layout findings: ${grand}`);
console.log(`Sections/cards left invisible by the reveal: ${stranded}`);
await browser.close();
// A stranded section is a hole in a client's deliverable, so it fails the run
// just as a layout finding does.
if (grand > 0 || stranded > 0) process.exit(1);
