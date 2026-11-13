# End-to-end tests

Playwright tests that drive the real app against the real Django backend:
sign-up and sign-in, discovery forms (studio screens, the client's form in
Arabic with upload, resume and submit, dead links), call notes (paste, speaker
mapping, timeline, include switch, delete and undo, citation highlight) and the
brand analysis (the current report, source drawers and links to the exact
answer/call turn, Add to Strategy, and stale state after an edit).
Client sign-off also covers password-gated submission, handling a note from a
second browser, and retrying a saved note whose success response was lost.
Approval tests cover an editor's proposal, the owner's decision in another
browser, retrying a lost success response, and refusing a stale decision.

## Run

```bash
# once: the backend's Python environment, with its requirements installed
#       (python -m venv … && pip install -r ../markyos-backend/requirements.txt)
npx playwright install chromium   # once

E2E_PYTHON=/path/to/backend/venv/bin/python npm run e2e
npm run e2e:ui                    # the same, in Playwright's UI
```

`npm run e2e` starts both servers and stops them afterwards:

- the backend on `:8010` (migrated first), with `E2E=1` (lifts the sign-up and
  sign-in rate limits) and `DISCOVERY_ANALYSIS_FAKE=1` (a fixed stand-in for
  Claude). Both only work in the dev settings;
- a production build of this app on `:3100`, pointed at that backend.

If something is already listening on either port it's reused as is, so a
backend you started yourself needs those two variables set too.

| Variable | Default | |
|---|---|---|
| `E2E_PYTHON` | `python3` | the backend's Python |
| `E2E_BACKEND_DIR` | `../markyos-backend` | the backend checkout, from this repo |
| `E2E_API` | `http://localhost:8010/api/v1` | |
| `E2E_BASE` | `http://localhost:3100` | |

The backend must allow the frontend origin in `CORS_ALLOWED_ORIGINS`.

For manually managed disposable servers, set `E2E_EXTERNAL_SERVERS=1`,
`E2E_API` and `E2E_BASE`. This skips Playwright's server startup/reuse logic;
it does not build or reconfigure the running frontend. Set
`PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome. Always point
`E2E_BACKEND_DIR` and its Django database settings at the same isolated
backend: fixtures run management commands there. Do not reuse a personal
service/database. The fake AI provider requires both DEBUG=True and
DISCOVERY_ANALYSIS_FAKE=True in that server's settings.

English-label journeys seed the visitor language explicitly; secondary browser
contexts use `/login?lang=en`. Other browser suites cover Arabic/RTL.

## Writing tests

- Set up what a test isn't about through the API (`fixtures.ts`: `newStudio`,
  `newBrand`, `sentForm`, `submitAsClient`, `call`), and drive the part it is
  about through the screen.
- Every test fails on a console error. A test that causes one on purpose says
  so: `test.use({ expectedErrors: [/status of 400/] })`.
- Each test makes its own studio and brand, so tests don't depend on each
  other or on what's already in the database.

A failure leaves a screenshot and a trace in `e2e/test-results/`
(`npx playwright show-trace <trace.zip>`), and an HTML report in
`e2e/playwright-report/`.
