/**
 * Tell a broken page apart from a broken server.
 *
 * Every sweep here measures a rendered page, and every one of them reports the
 * same thing when there is nothing to measure: "page looks empty". That
 * sentence has two completely different causes, and they need completely
 * different fixes:
 *
 *   1. The page is broken.    A real finding. Read the diff.
 *   2. The server is broken.  Not a finding at all. Restart `next dev`.
 *
 * Cause 2 happened on 15 Oct 2026 and cost a diagnosis. The dev server's
 * compile worker pool had died — its stdout was a pipe to a process that had
 * been killed, so every log write threw EPIPE until the workers went with it:
 *
 *     Error: Jest worker encountered 2 child process exceptions,
 *            exceeding retry limit
 *
 * The giveaway was that `/` and `/login` still answered 200 while
 * `/w/<slug>/builder` and `/v/<slug>` both served 500. Already-compiled routes
 * keep being served from the dev cache; anything needing fresh compilation
 * cannot be built any more. So a half-dead server looks healthy to a quick
 * check and fails only on the routes a sweep actually cares about — and it
 * fails as an *empty document*, which is indistinguishable from a template
 * that renders nothing.
 *
 * The fix is to read the HTTP status, which the sweeps never did. They asserted
 * on the DOM, and a 500 error page has a DOM.
 *
 * Two entry points, because the two causes arrive at different times:
 *
 *   * `assertServerUp()` runs once before the browser opens, and refuses to
 *     start a run against a server that cannot serve the routes under test.
 *     This is the cheap one, and it is what catches the failure above.
 *
 *   * `installServerGuard(page)` watches main-frame document responses for the
 *     rest of the run, so a server that dies *during* a sweep is named as such
 *     instead of being reported as twelve broken templates.
 */

/** Routes that must compile before a run means anything. */
const PROBE_PATHS = ["/", "/login"];

/**
 * Refuse to start a run against a server that is not serving.
 *
 * `extraPaths` is for the routes a given sweep actually drives — pass the
 * heavy, client-rendered ones (`/w/<slug>/builder`, `/v/<slug>`), because those
 * are the ones a dead worker pool cannot compile while the cheap routes still
 * answer 200.
 *
 * Deliberately uses `fetch` rather than a browser: it runs before Playwright
 * launches, so a dead server costs a second instead of a full sweep.
 */
export async function assertServerUp(base, extraPaths = []) {
  const paths = [...PROBE_PATHS, ...extraPaths];
  const results = [];

  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      // A dev server compiling a route for the first time is genuinely slow,
      // and a timeout here would be a false alarm of exactly the kind this
      // module exists to prevent.
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(90_000) });
      results.push({ path, status: res.status });
    } catch (err) {
      results.push({ path, status: 0, error: err?.message ?? String(err) });
    }
  }

  const dead = results.filter((r) => r.status === 0);
  const broken = results.filter((r) => r.status >= 500);

  if (dead.length === paths.length) {
    throw new Error(
      `No server at ${base}. Start it with \`npm run dev\` and wait for "Ready", ` +
        `then run this sweep again.\n  ${dead[0].error ?? "connection refused"}`,
    );
  }

  if (broken.length) {
    const ok = results.filter((r) => r.status > 0 && r.status < 500).map((r) => r.path);
    throw new Error(
      `The server at ${base} is answering, but ${broken.length} route(s) return 5xx:\n` +
        broken.map((r) => `  ${r.status}  ${r.path}`).join("\n") +
        (ok.length ? `\n  (these are fine: ${ok.join(", ")})` : "") +
        `\n\nThis is a broken server, not a broken page — nothing measured now would mean ` +
        `anything.\nIf the dev-server output mentions "Jest worker encountered ... child ` +
        `process exceptions",\nits compile workers have died: stop it and run \`npm run dev\` ` +
        `again. Routes already\ncompiled keep serving 200, which is why a quick check looks ` +
        `healthy.`,
    );
  }

  return results;
}

/**
 * Watch for a server that dies mid-run.
 *
 * Records 5xx responses for main-frame documents only: a failed image or a
 * cancelled prefetch is not a dead server, and sweeps already tolerate those.
 * Returns a handle whose `check()` throws if anything was recorded, so an
 * existing assertion can say "the server broke" rather than "the page is
 * empty".
 *
 * Call `check()` from the sweep's own render assertion, before it measures the
 * DOM — the whole point is to beat the misleading message to it.
 */
export function installServerGuard(page) {
  /** @type {{url: string, status: number}[]} */
  const failures = [];

  page.on("response", (res) => {
    if (res.status() < 500) return;
    const req = res.request();
    // Only the document a sweep is about to measure.
    if (req.resourceType() !== "document") return;
    if (req.frame() !== page.mainFrame()) return;
    failures.push({ url: res.url(), status: res.status() });
  });

  return {
    get failures() {
      return [...failures];
    },
    /** Throw if the server has served an error document since the last clear. */
    check(context = "") {
      if (!failures.length) return;
      const lines = failures.map((f) => `  ${f.status}  ${f.url}`).join("\n");
      throw new Error(
        `${context ? `${context}: ` : ""}the server returned an error document — ` +
          `this is a broken server, not a broken page:\n${lines}\n\n` +
          `Restart \`npm run dev\` and run the sweep again. If the server's output mentions ` +
          `"Jest worker",\nits compile workers died and only a restart fixes it.`,
      );
    },
    /** Forget what has been seen, for a sweep that deliberately visits an error route. */
    clear() {
      failures.length = 0;
    },
  };
}
