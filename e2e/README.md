# End-to-end tests

Playwright tests that drive the real app against the real Django backend:
sign-up and sign-in, discovery forms (studio screens, the client's form in
Arabic with upload, resume and submit, dead links), call notes (paste, speaker
mapping, timeline, include switch, delete and undo, citation highlight) and the
brand analysis (citations that open the exact answer or call turn, drafts,
stale after an edit).

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

The backend must allow `http://localhost:3100` in `CORS_ALLOWED_ORIGINS`.

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
