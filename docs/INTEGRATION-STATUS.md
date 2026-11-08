# Frontend / backend integration work

Updated 6 November 2026. This tracks the gaps found during the project review;
it does not replace the longer product roadmap.

| Order | Feature | Status |
| --- | --- | --- |
| 1 | Verified payments and subscriptions | Implemented; Stripe account configuration and live test-mode verification remain |
| 2 | Client sign-off submission | Implemented; published-site submission, owner-only resolution, migration and browser tests |
| 3 | Approval permissions | Implemented; authenticated proposals, owner-only decisions, protected history and browser tests |
| 4 | AI credit accounting | Pending: real ledger, balance and atomic charging/refunds |
| 5 | Custom domains | Pending: actual DNS verification and hosting integration |
| 6 | Workspace API keys | Pending: server-issued credentials and authentication |
| 7 | Outgoing webhooks | Pending: delivery, signatures, retries and event records |
| 8 | Workspace audit history | Pending: server-recorded actions and frontend display |

## Payments

Checkout creation, confirmation and subscription portal access now call Django.
Verified Stripe checkouts control plans; the browser cannot activate a plan by
editing a success URL or saving a `billing` object. Webhooks cover completion,
delayed payment success/failure, expiry, subscription changes and full pass
refunds. Published guideline access and admin plan totals use the same verified
entitlements. Billing changes returned by background sync update the frontend
without replacing unsaved content edits.

The old Next.js checkout route and its Stripe dependency were removed. Backend
prices and the frontend pricing table currently describe **per-brand** plans.
Outdated account-wide subscription promises have been corrected.

Backend setup and release checks: `../markyos-backend/docs/billing.md`.
Existing prototype billing records do not prove payment; reconcile any actual
historical purchases before rollout. No production deployment was performed.

## Client sign-off

Notes now live in their own backend records. Published guideline visitors can
submit without an account, after unlocking the guideline when it has a password.
Submission retries reuse a reference, so a lost response cannot create duplicate
notes. Errors keep the visitor's text and show no success message.

Team members can read the notes; only the owner can mark one handled. Both
actions use dedicated endpoints. Opening the team page loads current notes, and
Refresh notes loads later arrivals. Guideline saves cannot forge, erase or
resolve notes, and feedback refreshes do not trigger whole-brand saves.

Existing notes in saved brand documents and published snapshots are imported by
`brands.0005_signoffpin`. Draft and builder previews do not accept submissions.
The browser-only demo labels its notes as local to that browser.

Backend contract: `../markyos-backend/docs/signoffs.md`. Browser coverage is in
`e2e/signoffs.spec.ts`, including a password-protected page and a lost-response
retry across the real frontend and Django API.

## Approval permissions

Owners and editors submit proposals through a dedicated API. Only the current
owner can approve or reject; viewers and clients can read the queue. Proposer
and decision identities and timestamps come from the server. Optional review
notes are stored with the decision.

Approval history is independent of brand JSON. Stale saves cannot erase it or
forge a decision, and queue refreshes do not cause whole-brand editing conflicts.
An identical decision retry is safe; a conflicting second decision returns 409
and the UI reloads the current queue. Failed proposal requests retain their text
and retry reference, preventing duplicate proposals after a lost response.

Migration `brands.0006_approvalrequest` imports earlier records and marks them
as historical rather than assigning verified actors to browser-authored data.
Backend contract: `../markyos-backend/docs/approvals.md`. Browser tests are in
`e2e/approvals.spec.ts`.
