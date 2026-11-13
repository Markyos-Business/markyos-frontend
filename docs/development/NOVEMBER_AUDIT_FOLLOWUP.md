# November UX audit validation and fixes

Validated against current code on 2026-11-13. Original audit: [supplied November audit](Markyos%20UX%20Audit%20%E2%80%94%20November%202026.md); original observations covered a browser-only Company desktop session. Fixes preserve implemented API workflows and current product rules.

| Finding | Validation and implemented response |
| --- | --- |
| C1 | Confirmed Inter's Arial fallback shadowed Arabic Plex. Disabled that fallback; Chrome platform-font inspection confirms custom IBM Plex Sans Arabic glyphs. Existing shared Arabic sizing retained rather than guessing a universal size increase. |
| C2 | Added five linked setup steps and matching card progress, derived from saved data. Default supplied fonts count as configured. |
| C3 | Demo-only limitation. Hide unavailable API navigation and show dedicated Discovery/Analysis previews on direct routes. Working connected features remain. |
| C4 | Added account audience copy, neutral public states and Company navigation without Board. Copy does not change server roles. |
| H1 | Added Assets route, grouped navigation and pinned Team/Settings. Type lab is under Tools. |
| H2 | Shared AccountHeader on account-level feature pages, active section and consistent menu. |
| H3 | Identity/strategy have URL query deep links, refresh/Back, wrapping tabs, keyboard navigation and linked panels. Query routes preserve existing URLs rather than introducing breaking path routes. |
| H4 | Brand breadcrumb, separate wrapping page actions and shared account-menu language/theme controls. |
| H5 | Localized remaining overview counts and unpublished states; primary brand language used where known, mixed text isolated. Existing bidi/localization tests retained. No claim that every string in the product was rewritten. |
| H6 | User explicitly chose current pricing/limits. Checkout options consolidated in Account Billing; obsolete Saudi roadmap removed. |
| H7 | Limit state and New brand action link to plans/limits, with explicit explanation that per-brand payments do not raise account caps. No invented higher-cap checkout. |
| M1 | Dismissible demo notice and benefit-focused feature copy replace repeated implementation jargon. |
| M2 | Builder review includes missing brand essentials; publishing asks for confirmation and lists page errors plus missing essentials. Publishing remains possible after confirmation. |
| M3 | Reserved space under the canvas for floating publishing controls. |
| M4 | Arabic checker appears first in Arabic UI; strategy fill popover offers both directions. |
| M5 | Remaining invite/publish primary actions use accent styling. |
| M6 | Brand sorting uses an explicit dropdown. |
| M7 | Empty approved palette shows guidance and a link to Colours; no file comparison against zero colours. |
| M8 | Top bar uses breadcrumb text rather than a duplicate heading. |
| M9 | Initials derive from brand words (Markyos → M). |
| M10 | Empty logo downloads disabled; empty slots no longer receive a selection outline. Attached-slot selection remains. |
| M11 | Type sandbox moved to Tools. |
| A1 | Type choice precedes Google; unconfigured Google hidden. Existing server onboarding preserved. |
| A2 | All type-card descriptions visible before selection. |
| A3 | Required and malformed email errors distinguished. |
| A4 | Removed password mask placeholder. |
| A5 | Password precedes Forgot in DOM and tab order. |
| A6 | Removed confirmation from browser-only signup. Emailed password setup/reset retain security behavior. |
| A7 | Authentication language switch fixed in viewport. |

## Preserved pricing decision

Company $49 pass/$99 monthly, one brand; Studio $19/$29, unlimited brands; Freelancer $15/$19, three brands, no editors. Existing administrator overrides remain supported. Purchases apply per brand and do not raise account limits. Frontend, backend and marketing pricing contract check passes.

## Verification

Full frontend check (types, ESLint, Prisma schema, unit tests and design audits), production build, pricing contract check and isolated Chrome suites. Raw logs and browser JSON are retained in the workspace audit folder. Browser verification results are recorded in the workspace audit report (`audit/ux-november-2026-followup/REPORT.md`).

## Practical limits

No live payment, Google authorization, email delivery, AI provider, production deployment or moderated user research was performed. Backend source was unchanged in this follow-up; previous backend tests are not represented as a fresh run. Account copy is presentation, not authorization. Unknown unpublished public-brand language falls back to the viewer language without exposing private metadata. No new usability score is asserted.

Final results: 603 unit tests; production build and pricing contracts passed; all 11 existing browser suites passed after corrections; 14 focused audit/auth scenarios passed; Arabic bidi scan reported zero reversed runs. Provider behavior remains subject to the limits above.
