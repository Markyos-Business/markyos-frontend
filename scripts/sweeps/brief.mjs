import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const WS = "nadeen-studio";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const fail = [];
const pass = [];
const check = (name, ok, detail = "") => {
  (ok ? pass : fail).push(name);
  console.log(`${ok ? "ok    " : "FAIL  "} ${name}${detail ? ` — ${detail}` : ""}`);
};

await page.goto(`${BASE}/login`);
await page.waitForLoadState("networkidle");
await page.fill('input[type="email"]', "nadeen@studio.com");
await page.fill('input[type="password"]', "markyos2026");
await page.click('button[type="submit"]');
await page.waitForURL(/\/brands/, { timeout: 20000 });

const readWs = () =>
  page.evaluate((slug) => {
    const s = JSON.parse(localStorage.getItem("markyos:v1") || "{}");
    const ws = (s.workspaces || []).find((w) => w.slug === slug);
    return {
      briefs: (ws?.briefs || []).map((b) => ({
        id: b.id,
        token: b.token,
        label: b.label,
        status: b.status,
        questions: b.questions.length,
        answers: b.answers.length,
        revoked: b.revokedAt,
      })),
      drafts: (ws?.drafts || []).map((d) => ({ ref: d.targetRef, status: d.status, source: d.source, content: d.content })),
      positioning: ws?.strategy?.positioningStatement ?? "",
      purpose: ws?.strategy?.purpose ?? "",
    };
  }, WS);

// ------------------------------------------------- 1. seeded brief reads back ----
const start = await readWs();
check("a submitted brief is seeded", start.briefs.some((b) => b.status === "submitted"));

await page.goto(`${BASE}/w/${WS}/brief`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
let body = await page.evaluate(() => document.body.innerText);
check("the brief page lists it", body.includes("Nadeen Studio — own brand"));
check("its state is named in words", /Submitted/.test(body));

// Open it and confirm the answers are readable.
const readBtn = await page.$('button:has-text("Read answers")');
check("a submitted brief offers its answers", !!readBtn);
if (readBtn) {
  await readBtn.click();
  await page.waitForTimeout(500);
  body = await page.evaluate(() => document.body.innerText);
  check("answers are shown verbatim", body.includes("Arabic-first brand systems"));
  check("a choice answer renders its label, not its value", body.includes("Both, equally"));
}

// ------------------------------------------------------- 2. create a brief ----
await page.click('button:has-text("+ New brief")');
await page.waitForTimeout(400);

await page.click('button:has-text("Rebrand")');
const labelInput = await page.$('input[placeholder="Rebrand brief"]');
check("naming the brief is offered", !!labelInput);
if (labelInput) await labelInput.fill("Almarai — rebrand");
const clientInput = await page.$('input[placeholder="Layla — Almarai Foods"]');
if (clientInput) await clientInput.fill("Layla Haddad");

await page.click('button:has-text("Create brief")');
await page.waitForTimeout(800);

let s = await readWs();
const created = s.briefs.find((b) => b.label === "Almarai — rebrand");
check("the brief was created", !!created, created ? `${created.questions} questions` : "");
check("it starts unsent", created?.status === "draft");
check("the rebrand template seeded fewer questions than new-brand", created.questions < 19, `${created.questions}`);

// ------------------------------------- 3. an unsent brief is not readable ----
await page.goto(`${BASE}/b/${created.token}`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
body = await page.evaluate(() => document.body.innerText);
check("an unsent brief refuses to open", /isn't ready yet/i.test(body), body.slice(0, 60).replace(/\n/g, " "));

// ------------------------------------------------- 4. adjust and send it ----
await page.goto(`${BASE}/w/${WS}/brief`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);

const editBtns = await page.$$('button:has-text("Edit")');
await editBtns[0].click();
await page.waitForTimeout(500);

// Turn one question off, and confirm the count follows.
const toggles = await page.$$('button[role="switch"][aria-checked="true"]');
check("included questions render as switches", toggles.length > 5, `${toggles.length}`);
await toggles[0].click();
await page.waitForTimeout(600);
s = await readWs();
const afterToggle = s.briefs.find((b) => b.id === created.id);
check("turning a question off removes it", afterToggle.questions === created.questions - 1);

await page.click('button:has-text("Send it")');
await page.waitForTimeout(700);
s = await readWs();
check("sending marks it live", s.briefs.find((b) => b.id === created.id).status === "sent");

// --------------------------------------------- 5. the client fills it in ----
const token = created.token;
await page.goto(`${BASE}/b/${token}`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);

body = await page.evaluate(() => document.body.innerText);
check("the brief opens for the client", /Let's start with the basics/.test(body));
check("it carries the studio's name", body.includes("Nadeen Studio"));

// The client form must not be a way into the app.
const chrome = await page.evaluate(() => ({
  sidebar: !!document.querySelector('a[href*="/w/"]'),
  progress: /\d+ of \d+/.test(document.body.innerText),
}));
check("no navigation into the workspace is exposed", !chrome.sidebar);
check("progress is shown so a long form feels finite", chrome.progress);

// Every question must be reachable by its label — a label that does not focus
// its field is the defect this codebase already fixed once in TextField.
// Two valid shapes, and both have to actually resolve: a text question uses
// label[for] -> the field's id, a radiogroup uses aria-labelledby -> the
// label's id. A reference pointing at nothing reads as an unlabelled control.
const labelled = await page.evaluate(() => {
  const forLabels = [...document.querySelectorAll("label[for]")];
  const groups = [...document.querySelectorAll('[role="radiogroup"]')];
  const dangling = [
    ...forLabels.filter((l) => !document.getElementById(l.getAttribute("for"))).map((l) => `for=${l.getAttribute("for")}`),
    // A group is named by aria-label OR aria-labelledby. Only a labelledby
    // pointing at a missing element is a fault.
    ...groups
      .filter((g) => {
        if (g.getAttribute("aria-label")?.trim()) return false;
        const ref = g.getAttribute("aria-labelledby");
        return !ref || !document.getElementById(ref);
      })
      .map((g) => `group labelledby=${g.getAttribute("aria-labelledby")}`),
  ];
  return { forCount: forLabels.length, groupCount: groups.length, dangling };
});
check(
  "every label reference resolves to a real element",
  labelled.dangling.length === 0,
  `${labelled.forCount} labels, ${labelled.groupCount} groups, dangling: ${labelled.dangling.join(", ") || "none"}`,
);

// Answer a mapped question (purpose) and an unmapped one.
const areas = await page.$$("textarea");
check("the form renders answer fields", areas.length > 3, `${areas.length}`);
await areas[0].fill("We make dairy people actually trust.");
await page.waitForTimeout(400);
await areas[1].fill("Because most regional dairy brands sound like a factory wrote them.");
await page.waitForTimeout(700);

s = await readWs();
const inProgress = s.briefs.find((b) => b.id === created.id);
check("answers save as they are typed", inProgress.answers >= 2, `${inProgress.answers}`);
check("a started brief is distinguishable from an unopened one", inProgress.status === "in_progress");

// --------------------------------------------------------- 6. submit ----
await page.click('button:has-text("Send my answers")');
await page.waitForTimeout(1000);
body = await page.evaluate(() => document.body.innerText);
check("submitting thanks the client", /Thank you/.test(body));

s = await readWs();
check("the brief is submitted", s.briefs.find((b) => b.id === created.id).status === "submitted");

/*
 * The rule the brief exists to respect: a client's words become proposals, not
 * the brand's strategy. If this fails, handing a brief to an outsider means
 * handing them write access to the brand.
 */
const fromBrief = s.drafts.filter((d) => d.source === "brief" && d.status === "pending");
check("mapped answers became pending drafts", fromBrief.length >= 1, `${fromBrief.length}`);
check(
  "an answer mapped to purpose targets purpose",
  fromBrief.some((d) => d.ref === "purpose"),
  JSON.stringify(fromBrief.map((d) => d.ref)),
);
check("the client's words did NOT reach the strategy", !s.purpose.includes("factory wrote them"));
check("the studio's own purpose is untouched", s.purpose === start.purpose);

// --------------------------------------------- 7. resubmission is refused ----
await page.goto(`${BASE}/b/${token}`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
body = await page.evaluate(() => document.body.innerText);
check("a submitted brief cannot be filled in again", /Thank you/.test(body));

const draftsAfterRevisit = (await readWs()).drafts.filter((d) => d.source === "brief").length;
check("revisiting does not duplicate drafts", draftsAfterRevisit === s.drafts.filter((d) => d.source === "brief").length);

// ------------------------------------------------------ 8. closing a link ----
await page.goto(`${BASE}/w/${WS}/brief`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(600);
// The seeded brief is submitted, so use the other one's close control.
const closeBtn = await page.$('button:has-text("Close link")');
if (closeBtn) {
  await closeBtn.click();
  await page.waitForTimeout(500);
  const closeIt = await page.$('button:has-text("Close it")');
  if (closeIt) {
    await closeIt.click();
    await page.waitForTimeout(700);
  }
}
s = await readWs();
check("a link can be closed", s.briefs.some((b) => b.revoked));

const revoked = s.briefs.find((b) => b.revoked);
await page.goto(`${BASE}/b/${revoked.token}`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
body = await page.evaluate(() => document.body.innerText);
// A closed link has to say it was switched off, not 404 — those are different
// answers for the person holding the link.
check("a closed link says it was switched off", /was closed/i.test(body), body.slice(0, 60).replace(/\n/g, " "));

await page.goto(`${BASE}/b/definitely-not-a-real-token`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
body = await page.evaluate(() => document.body.innerText);
check("an unknown link says something different", /doesn't exist/i.test(body));

console.log(`\n${pass.length} passed, ${fail.length} failed`);
if (fail.length) console.log("FAILED:", fail.join(" | "));
await browser.close();
process.exit(fail.length ? 1 : 0);
