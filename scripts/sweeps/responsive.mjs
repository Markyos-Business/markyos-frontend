import { chromium } from "playwright";

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

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();

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
          t.lang = lang;
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

let grand = 0;
let checked = 0;
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
await browser.close();
