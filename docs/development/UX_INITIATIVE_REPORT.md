# UX/UI initiative: implementation report

Brief: "Senior Product Manager & Senior Frontend Engineer — UX/UI Audit and Improvement" (19 Nov 2026). Its requirement IDs (C1–C4, H1–H7, M1–M11, A1–A7) follow the [November UX audit](Markyos%20UX%20Audit%20%E2%80%94%20November%202026.md); a first pass on that audit landed on 13 Nov ([follow-up](NOVEMBER_AUDIT_FOLLOWUP.md)). This round re-audited the code against the brief and fixed what was still open.

All work is on `release/staging-v1` in markyos-frontend, merged locally, not pushed. The backend was not changed.

## A. Audit summary

- Many brief items were already built on 13 Nov (onboarding checklist, Arial fallback fix, hidden demo-only navigation, account-type cards, Google gated on configuration). They were re-verified, not rebuilt.
- "Exploration, Analytics, Surveys" are real features (Discovery, Analysis, Questionnaires) with working backends; the "needs a server" message appeared only in the browser-only demo build.
- No translation library: copy is inline English/Arabic pairs across ~420 files (~3,000–3,500 pairs), with no plural rules and no lint against hardcoded text.
- The backend answers only in English (no LocaleMiddleware, no Arabic catalogue), so server error text reached Arabic screens as English.
- Account-type rules were scattered; wording leaked studio/client language to Company accounts in ~12 places; the Board opened for a company by URL.
- The pre-publish check reviewed only the open page and the backend publish endpoint validates no content.

## B. Implementation summary

| ID | Status | What changed | Main files |
|---|---|---|---|
| C1 Arabic typography | Done | IBM Plex Sans Arabic confirmed as the product's Arabic face (spec updated). No letter-spacing on any right-to-left text (`:dir(rtl)` rule covers utilities and inline theme styles). Latin brand fonts on the guideline site fall back to the Arabic stack. Monospace removed from a free-text box. | `tailwind/base.js`, `tailwind/tokens.js`, `guideline-site/utils/brand-fonts.ts`, `docs/MARKYOS_UI.md` |
| C2 Onboarding | Existing (13 Nov) | Five linked steps derived from saved brand data; verified. | `lib/data/brandSetup.ts`, `overview/brand-insights-card.tsx` |
| C3 Unavailable features | Done | Features are live in the connected app; demo-only wording rewritten for customers in both languages. | `discovery/shared/needs-server.tsx`, demo notes |
| C4 Account experiences | Done | `accountCapabilities()` is the one place that decides what each type gets; navigation and a Board route guard read it. Company wording for discovery, brand language, subdomain; neutral public share and review wording. | `lib/data/accountExperience.ts`, `board/hooks/use-board-page.ts` |
| H1 Sidebar | Done | Distinct Overview icon (Assets kept its own); grouping and pinned Team/Settings from 13 Nov kept. | `shell/components/sidebar.tsx` |
| H2 Page headers | Done | 29 pages moved to the kit `PageHeader` (gained `eyebrow`, bidi-isolated titles). `DashboardHeader` kept for rich titles, with a note why. | `components/ui/page-header.tsx`, feature views |
| H3 Tabs and routing | Done | Drafts, compliance, departments, forms status and account tabs live in the URL; Back/Forward work; Discovery pushes history. Phone tab row scrolls instead of wrapping. | `hooks/useUrlTab.ts`, `shell/components/top-bar.tsx` |
| H4 Strategy header | Done | Share and Edit/Read stay; Fill another language and Import move to a More menu. | `strategy/.../strategy-actions.tsx` |
| H5 English and RTL | Done for errors and kit; per-screen copy in Phase 6 | `errorText()` words every failure in the reader's language (52 screens); DataTable and other kit strings in Arabic; breadcrumb and avatars bidi-isolated; `<html>` lang/dir now set on the brands home. | `lib/api/errorText.ts`, `components/ui/data-table/labels.ts`, `shell/components/account-header.tsx` |
| Translation architecture | Foundation done | `plural()` (Arabic zero/one/two/few/many), number/percent/money formatting, kit Breadcrumb, `react/jsx-no-literals` on the kit (folder list grows per screen), RTL audit scans all of `src`. Keyed catalogues: screen by screen with the copy guide. | `lib/i18n/*`, `eslint.config.mjs`, `scripts/rtl-audit.mjs` |
| Beta messaging / M1 | Done | One dismissible notice at the top (beta in the app, demo in the demo build), remembered per browser; developer wording replaced. | `shell/components/beta-notice.tsx` |
| M2 Pre-publish | Done | Reviews every page plus brand setup; "Must fix" vs "Worth checking", each linking to the fix; matching EN/AR status. Must fix blocks publishing in the editor and on the server (`publish_blocked`, decided 20 Nov); copy findings moved to Worth checking. | `builder/utils/site-review.ts`, `builder/hooks/use-builder-page.ts`, backend `apps/brands/publish_check.py` |
| M3 Publishing bar | Existing (13 Nov) | Space reserved under the canvas; verified in the builder. | `builder/components/shared/ship-cluster.tsx` |
| M4 Translation editor | Done | Arabic first in the Arabic UI; every field carries its own dir and lang. | `builder/components/inspector/block-inspector.tsx` |
| M5 Buttons | Done in the kit | One variant per job (secondary/destructive/light duplicates removed); Brand files upload on the kit Button. Remaining hand-made buttons are mostly custom controls (canvas, chips) and were left. | `components/ui/button/*` |
| M6 Sorting | Done | Kit `SortControl` with bilingual labels and direction on forms list and brand files. | `components/ui/filter/sort-control.tsx` |
| M7 Colour check | Done | One header for empty and filled states. | `compliance/asset-color-content.tsx` |
| M8 Headings | Done | One visible h1 per page (checked by e2e on 17 screens × 8 variants); `/assets` titled to match the sidebar. | e2e `ux-matrix.spec.ts` |
| M9 Avatars | Done | Brand logo first, else one letter in either script; account menu no longer shows "ND"/"NA". | board card, share header, account menu |
| M10 Empty file manager | Done | Downloads disabled when empty (13 Nov); the page-wide blue outline came from a focusable tab panel and is gone. | `shell/components/page-shell.tsx`, `components/ui/tabs/tab-panel.tsx` |
| M11 Font Lab | Existing (13 Nov) | "Type sandbox" under Tools. | `shell/components/sidebar.tsx` |
| A1–A2 | Existing | Type chosen before Google; descriptions on the cards. | `auth/components/signup/*` |
| A3 | Done | "Enter your email address." vs "Enter a valid email address." on sign-in, sign-up and reset, both languages. | `auth/copy.ts`, `auth/hooks/reset/*` |
| A4 | Done | No decorative password placeholder. | `components/ui/field/password-field.tsx` |
| A5 | Verified | Email → password (with show/hide) → Forgot password. | `auth/components/login/login-form.tsx` |
| A6 | N/A | Sign-up has no password; the confirm field exists only on reset and was kept. | — |
| A7 | Existing | Language switch fixed in the corner of auth pages. | `components/ui/form/auth-layout.tsx` |
| H6 Pricing | Done (wording) | App, site and backend prices agree; the Project Pass is no longer presented except on brands that hold one; "Stripe" removed from the admin dialog; legacy checkout toasts bilingual. Payment behaviour unchanged. | `account/components/billing/*`, `settings/*` |
| H7 Upgrade flow | Paused | PayPal work paused by product owner; status only. | — |
| Public questionnaire | Done | Answer errors in the form's language with Arabic plurals. | `discovery/utils/question-types.ts` |

## C. Outstanding issues

**Blocked or awaiting a decision**
- **UX copy (Phase 6):** the copy guide "دليل نصوص الواجهة" is not in any repo. Screen-by-screen copy and keyed catalogues wait for it. Arabic added in this round is a draft to align with the guide.
- **Upgrade modal and plan comparison (H7):** paused with the PayPal work.
- **Google sign-in in production:** the backend's Google client id and secret are empty in `.env.prod`; either set them or keep the button off in the prod build.

**Backend dependencies**
- Error codes (or Arabic messages) from the API, so specific validation messages can be shown in Arabic instead of the generic line.
- Remembering the beta-notice dismissal per account needs a field on the account.
- The brand owner's account type is not in the brand payload, so reviewer-facing pages use neutral wording.

**Known limitations**
- `useUrlTab` ignores same-page `<Link>` changes on drafts/compliance/departments (only Back/Forward and its own changes).
- Old brand data may still carry two-letter `initials`; nothing displays them any more.
- Stripe checkout code and backend routes remain for legacy subscribers; removing them is billing work.
- Remaining hand-made `<button>`s are mostly custom controls; converting them needs a design pass per control.

## D. Testing report

| Run | Result |
|---|---|
| `npm run check` on the merged branch (typecheck, lint, 68 test files / 760 unit tests, contrast, token, RTL, radius, icon audits) | Passed |
| e2e suite against an isolated backend (port 8020, fresh database, console email) and a production build (port 3110) | 24 passed |
| New e2e matrix: 17 screens × Arabic/English × light/dark × 390px/1366px | Passed: no sideways scroll, one visible h1, no page errors |
| Browser checks: Arabic letter-spacing computed `normal`, Plex rendering, tab panel not focusable, breadcrumb | Passed |

Regressions found and fixed during QA: the brands home laid out left-to-right in Arabic (document language never set there); a brand made outside the app showed "NaN years ago"; the questionnaire revoke notice still said "the studio". One existing e2e (brands home must not scroll) had been failing since the 16 Nov footer; it now checks that the page ends at its footer, the property that matters for a page without a sidebar frame.

Still to do by hand: staging click-through (the security checkpoint blocks automated checks there), tablet widths, real file uploads, Google sign-in, PayPal sandbox.

## E. Product recommendations (not in scope)

- Add "invite your team" as an onboarding signal (the team data already exists).
- Return error codes from the API and map them to copy, which unlocks specific Arabic validation messages.
- Put the brand owner's account type on brand payloads so reviewer pages can speak to companies' partners precisely.
- Track time to first published guideline, as the November audit proposed.
