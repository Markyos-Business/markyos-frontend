import { chromium } from "playwright";
import { assertServerUp } from "./serverGuard.mjs";

// Override with SWEEP_BASE to sweep a server on another port.
const BASE = process.env.SWEEP_BASE ?? "http://localhost:3000";
const WS = "nadeen-studio";

// A 500 error page has a DOM, and it contains no Arabic at all — so a dead
// server reports zero reversed runs and passes. See serverGuard.mjs.
await assertServerUp(BASE, [`/w/${WS}/overview`]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/login`);
await page.waitForLoadState("networkidle");
await page.fill('input[type="email"]', "nadeen@studio.com");
await page.fill('input[type="password"]', "markyos2026");
await page.click('button[type="submit"]');
await page.waitForURL(/\/brands/, { timeout: 15000 });

/**
 * General bidi sweep. Any run that is purely Latin/numeric (no Arabic letters)
 * must paint left-to-right even inside dir=rtl. Genuine Arabic text is
 * expected to paint right-to-left, so it is excluded rather than flagged.
 */
const sweep = () =>
  page.evaluate(() => {
    const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
    const LATIN = /[A-Za-z0-9]/;
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const raw = n.nodeValue || "";
      const text = raw.trim();
      if (text.length < 3) continue;
      if (ARABIC.test(text)) continue;      // real Arabic: RTL order is correct
      if (!LATIN.test(text)) continue;      // punctuation / symbols only
      const el = n.parentElement;
      if (!el || !el.offsetParent) continue;
      if (getComputedStyle(el).direction !== "rtl") continue;

      const start = raw.indexOf(text);
      const rectOf = (i) => {
        const r = document.createRange();
        r.setStart(n, start + i);
        r.setEnd(n, start + i + 1);
        return r.getBoundingClientRect();
      };
      // Compare the first and last STRONG characters only. Neutral punctuation
      // at either end legitimately reflows in an RTL paragraph; that is a
      // translation gap, not a reversed run, and conflating the two just
      // inflates the count with things no code change here can fix.
      const strong = [];
      for (let i = 0; i < text.length; i++) if (LATIN.test(text[i])) strong.push(i);
      if (strong.length < 2) continue;
      const first = rectOf(strong[0]);
      const last = rectOf(strong[strong.length - 1]);
      if (!first.width && !last.width) continue;
      // Only comparable when both characters sit on the same visual line.
      if (Math.abs(first.top - last.top) > 2) continue;

      if (first.left > last.left) {
        out.push({
          text: text.slice(0, 60),
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 40),
        });
      }
    }
    return out;
  });

const PAGES = [
  "overview",
  "forms",
  "moodboard",
  "drafts",
  "visual-identity",
  "strategy",
  "departments",
  "builder",
  "type-lab",
  "compliance",
  "team",
  "settings",
];

// Switch the whole app to Arabic once; the choice persists in the store.
await page.goto(`${BASE}/w/${WS}/overview`);
await page.waitForLoadState("networkidle");
await page.click('button:has-text("ع")');
await page.waitForTimeout(600);

let total = 0;
for (const slug of PAGES) {
  await page.goto(`${BASE}/w/${WS}/${slug}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Walk every tab on the page, not just the default one.
  const tabs = await page.$$('[role="tablist"] button, nav button');
  const rounds = Math.max(1, Math.min(tabs.length, 10));
  const seen = [];
  for (let i = 0; i < rounds; i++) {
    const btns = await page.$$('[role="tablist"] button, nav button');
    if (btns[i]) {
      try {
        await btns[i].click({ timeout: 2000 });
        await page.waitForTimeout(300);
      } catch {
        /* not a tab; measuring the current view is still useful */
      }
    }
    const bad = await sweep();
    for (const b of bad) {
      const key = `${slug}|${b.text}`;
      if (!seen.includes(key)) {
        seen.push(key);
        console.log(`BROKEN  ${slug.padEnd(16)} <${b.tag}> "${b.text}"`);
        total++;
      }
    }
  }
}

console.log(`\nTotal reversed Latin/numeric runs in Arabic: ${total}`);

await browser.close();
