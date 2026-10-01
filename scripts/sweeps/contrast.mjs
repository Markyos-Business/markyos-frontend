import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const WS = "nadeen-studio";

const browser = await chromium.launch();
const findings = [];

/**
 * Rendered contrast, measured against the actual painted background rather
 * than against the token the element claims to use. Small text carries the
 * 7:1 bar: 4.5 is calibrated for ~16px and this UI sets a lot of 9–11px type.
 */
const AUDIT = () => {
  const SMALL = 12.5;
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  // The nearest ancestor that actually paints something.
  const groundOf = (el) => {
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    const stack = [];
    for (let p = el; p; p = p.parentElement) {
      const c = parse(getComputedStyle(p).backgroundColor);
      if (c && c.a > 0) stack.push(c);
      if (c && c.a === 1) break;
    }
    for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg);
    return bg;
  };

  const out = [];
  for (const el of document.querySelectorAll("*")) {
    if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    if (el.closest("[aria-hidden='true']")) continue;
    if (el.disabled) continue;
    // Own text only — a container's ratio is its children's problem.
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.nodeValue.trim())
      .join("")
      .trim();
    if (text.length < 2) continue;

    const cs = getComputedStyle(el);
    // Fold inherited opacity: a 0-opacity node reads as 1:1 otherwise.
    let op = 1;
    for (let p = el; p; p = p.parentElement) op *= parseFloat(getComputedStyle(p).opacity || "1");
    if (op < 0.06) continue;

    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;
    const bg = groundOf(el);
    const fg = over({ ...fgRaw, a: fgRaw.a * op }, bg);
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);

    /*
     * The ownership boundary, as the markup already encodes it.
     *
     * Inside `[data-guideline-surface]` the colours are the *brand's*, derived
     * from the studio's own palette. Those get AA guaranteed by construction
     * and no more: pushing a studio's blue to AAA stops it being their blue.
     * Everything above that bar is surfaced to the studio by the in-app
     * ContrastReport rather than silently rewritten. Only app chrome — the
     * part Markyos owns — carries the 7:1 small-text bar.
     */
    const brandOwned = !!el.closest("[data-guideline-surface]");
    const need = large ? 3 : brandOwned ? 4.5 : size < SMALL ? 7 : 4.5;
    const r = ratio(fg, bg);
    if (r + 0.01 < need) {
      out.push({
        text: text.slice(0, 40),
        size: Math.round(size * 10) / 10,
        ratio: Math.round(r * 100) / 100,
        need,
        cls: (el.className || "").toString().slice(0, 40),
      });
    }
  }
  return out;
};

for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme,
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "nadeen@studio.com");
  await page.fill('input[type="password"]', "markyos2026");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/brands/, { timeout: 20000 });

  // Paint the states that only exist once data is in them: both non-default
  // asset badges, and a brief that is open for answers rather than already
  // submitted — otherwise the public page measured is the thank-you screen.
  await page.evaluate((slug) => {
    const s = JSON.parse(localStorage.getItem("markyos:v1"));
    for (const w of s.workspaces || []) {
      if (w.slug !== slug) continue;
      if (w.assets[0]) w.assets[0].status = "exploration";
      if (w.assets[1]) w.assets[1].status = "archived";
      if (w.briefs?.[0]) {
        w.briefs[0].status = "sent";
        w.briefs[0].submittedAt = null;
        w.briefs[0].revokedAt = null;
      }
    }
    localStorage.setItem("markyos:v1", JSON.stringify(s));
  }, WS);

  const PAGES = [
    "overview",
    "brief",
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

  for (const slug of PAGES) {
    await page.goto(`${BASE}/w/${WS}/${slug}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    // Walk every tab, not just the page's default one. Measuring only the
    // default tab is what once hid seven of Visual identity's eight panels.
    const count = (await page.$$('[role="tablist"] button, nav button')).length;
    for (let i = 0; i < Math.max(1, Math.min(count, 10)); i++) {
      const btns = await page.$$('[role="tablist"] button, nav button');
      if (btns[i]) {
        try {
          await btns[i].click({ timeout: 2000 });
          await page.waitForTimeout(300);
        } catch {
          /* not a tab — measuring the current view is still useful */
        }
      }

      // Open the asset detail panel so the status control gets measured too.
      if (slug === "visual-identity") {
        const d = await page.$('button[aria-label^="Details for"]');
        if (d) {
          await d.click();
          await page.waitForTimeout(400);
        }
      }

      const bad = await page.evaluate(AUDIT);
      for (const b of bad) {
        const key = `${theme}|${slug}|${b.text}|${b.ratio}`;
        if (!findings.some((f) => f.key === key)) findings.push({ key, theme, label: slug, ...b });
      }

      if (slug === "visual-identity") {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
      }
    }
  }

  /*
   * The alternate section layouts, which the builder page above renders only in
   * their defaults.
   *
   * These matter more than most surfaces here, because several of them set type
   * directly *on* a client's own colour — a palette band's name and value, the
   * featured block's format list. `bestInkOn` picks the highest-contrast ink
   * available there, so any opacity applied on top spends the only margin that
   * exists, and how much there was depends on a colour this code has never seen.
   * The first draft faded 9px format labels to 0.6 and rendered 3.76:1.
   *
   * Driven through localStorage rather than through the inspector: setting every
   * section's Nth layout at once audits the whole set in three reloads instead of
   * sixteen, and this sweep already pays for two themes.
   */
  for (const round of [1, 2, 3]) {
    const applied = await page.evaluate(
      ({ slug, n }) => {
        const s = JSON.parse(localStorage.getItem("markyos:v1"));
        const ws = (s.workspaces || []).find((w) => w.slug === slug);
        if (!ws) return [];
        // Mirrors lib/sectionVariants.ts. Duplicated on purpose: a sweep that
        // imported the registry would pass by construction when a layout was
        // dropped from it, which is one of the things worth noticing.
        const SETS = {
          color: ["cards", "bands", "chips", "feature"],
          logo: ["full", "lockups", "hero"],
          typography: ["specimen", "scale", "poster"],
          photography: ["grid", "feature", "strip"],
          icons: ["grid", "named", "dense"],
          mockups: ["two-up", "one-up", "three-up"],
        };
        const out = [];
        for (const [id, keys] of Object.entries(SETS)) {
          if (!keys[n]) continue;
          ws.sectionStyles[id] = { ...(ws.sectionStyles[id] || {}), variant: keys[n] };
          out.push(`${id}:${keys[n]}`);
        }
        ws.updatedAt = Date.now();
        localStorage.setItem("markyos:v1", JSON.stringify(s));
        return out;
      },
      { slug: WS, n: round }
    );
    if (applied.length === 0) continue;

    await page.goto(`${BASE}/w/${WS}/builder`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(900);

    // The guard that makes this worth running: a clean measure of a canvas that
    // never drew the layouts proves nothing. At least one has to be on screen.
    const drew = await page.evaluate(() => document.querySelectorAll("[data-layout]").length);
    if (drew === 0) {
      findings.push({
        key: `${theme}|layouts-round-${round}|none-rendered`,
        theme,
        label: `section layouts (round ${round})`,
        text: "no [data-layout] element rendered — the layouts were not measured",
        size: 0,
        ratio: 0,
        need: 0,
        cls: "",
      });
    } else {
      const bad = await page.evaluate(AUDIT);
      for (const b of bad) {
        const key = `${theme}|layouts|${b.text}|${b.ratio}`;
        if (!findings.some((f) => f.key === key)) {
          findings.push({ key, theme, label: `section layouts (${applied.join(" ")})`, ...b });
        }
      }
    }
  }

  // Back to the defaults, so nothing after this measures a layout it did not ask
  // for. The context is thrown away at the end of the theme anyway; this is to
  // keep the failure messages honest if that ever stops being true.
  await page.evaluate((slug) => {
    const s = JSON.parse(localStorage.getItem("markyos:v1"));
    const ws = (s.workspaces || []).find((w) => w.slug === slug);
    if (!ws) return;
    for (const v of Object.values(ws.sectionStyles || {})) delete v.variant;
    localStorage.setItem("markyos:v1", JSON.stringify(s));
  }, WS);

  /*
   * The client-facing discovery brief, which no /w/ page covers. It is the one
   * surface someone outside the studio actually fills in, so it gets the same
   * bar as the rest of the chrome — the client's brand does not exist yet, so
   * none of it is brand-owned.
   */
  const token = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("markyos:v1") || "{}");
    for (const w of s.workspaces || []) {
      for (const b of w.briefs || []) if (b.status !== "draft" && !b.revokedAt) return b.token;
    }
    return null;
  });
  if (token) {
    await page.goto(`${BASE}/b/${token}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    // Guard, for the same reason the responsive sweep has one: a clean measure
    // of a "this brief isn't ready" card would prove nothing about the form.
    const isForm = await page.evaluate(() => document.querySelectorAll("textarea").length > 2);
    if (!isForm) throw new Error("public brief page did not render the form");
    const bad = await page.evaluate(AUDIT);
    for (const b of bad) {
      const key = `${theme}|brief-public|${b.text}|${b.ratio}`;
      if (!findings.some((f) => f.key === key)) findings.push({ key, theme, label: "brief-public", ...b });
    }
  } else {
    console.log(`  (no sent brief in ${theme} fixture — public brief page not measured)`);
  }

  await ctx.close();
}

console.log(`\n=== rendered contrast: ${findings.length} findings ===`);
for (const f of findings) {
  console.log(`  ${f.theme}/${f.label} ${f.ratio}:1 (needs ${f.need}) @${f.size}px "${f.text}" ${f.cls}`);
}

await browser.close();
process.exit(findings.length ? 1 : 0);
