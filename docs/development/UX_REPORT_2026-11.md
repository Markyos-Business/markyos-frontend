# Markyos UI/UX report: November 2026

21 Nov 2026 · frontend `56c4cf8`, backend `6384b56` (release/staging-v1) · production build, seeded local data.

Shareable version with screenshots: https://claude.ai/artifact/MjPBm5qXGQzwVyxHRragbE (private until shared).

## Status (21 Nov 2026): every finding closed or decided

Merged locally on release/staging-v1, not deployed. 34 fixed or corrected, 6 closed without a change (reasons below).

| Finding | Outcome | Commit |
|---|---|---|
| UX-01 clients can't see their brand | Fixed: the app keeps the role the server reports | a7c1fb4 |
| UX-02 no studio phone menu | Corrected: links were in the avatar menu; desktop duplicate removed | f927fbb |
| UX-03 Discovery rows on phone; Copy link stretched | Fixed: rows stack; copy buttons keep a one-word label | 4bc7bad, dccf670 |
| UX-04 builder top bar on phone | Fixed: switcher and View/Copy in More; compact review chip; preview fits | 0690c0b |
| UX-05 moodboard on phone | Fixed: list view on phone; Delete board behind More | 3fd4a7b |
| UX-06 Team roles on phone | Fixed: kit Row wraps its control | b9f19bd |
| UX-07 clients get the studio's home | Fixed: reviewer home and navigation (Brands, Notifications) | a0de300, e11ce1b |
| UX-08 SSO developer note | Fixed: disabled switch, customer copy | 1164f7d |
| UX-09 stock 404 | Fixed: branded, bilingual, theme-aware | 68ae232 |
| UX-10 password gate | Fixed: brand logo, EN/ع switch, one-sentence help | ac9ade0, 2725068 |
| UX-11 questionnaire shell | Fixed: pill language switch, ?lang respected, bidi-safe title. Its colours and light/dark ground are the studio's form theme by design | 821065e, 24116fd, 2725068 |
| UX-12 Arabic leftovers | Fixed: dates, analysis labels, citation chips, LTR values, terms | 614ef7a |
| UX-13 three builder statuses | Fixed: clean review says No issues when nothing is unpublished | 74dfe4e |
| UX-14 Add English version in Arabic | Fixed, and worse than reported: the button switched the brand's own language. Now shows the brand language and opens Settings | 0e6cdb6 |
| UX-15 Brand files duplicates Assets | Fixed: tab removed; Visual identity opens on Logo system | cf76ac9 |
| UX-16 sidebar cuts off items | Fixed: active item scrolls into view; bottom fade | a3d019c |
| UX-17 filled fields | No change: the filled field with underline state is your 13 Nov decision | — |
| UX-18 page headers differ | No change: top-bar section tabs are the app's shell pattern; the specific failures under it are fixed elsewhere | — |
| UX-19 brands home buries brands | Fixed: count tiles and duplicate welcome buttons removed | e11ce1b |
| UX-20 several names for one thing | Fixed: brand (not workspace), Type lab, Colour, مُرسَل, الفريق والسجل. Moodboard "قسم" is used consistently and kept. Rest waits for the Phase 6 copy guide | 614ef7a, e11ce1b, a505a2b |
| UX-21 empty brand gives no next step | Fixed: steps are links, the next says Next; Auto-fill explains itself | 0e6cdb6, cd2b3ed |
| UX-22 blank logo pair | Not confirmed: the tiles render whenever a lockup is attached; in the audit they sat at the fold | — |
| UX-23 secondary panels first | Fixed: palette before contrast; finished checklist collapses | cf76ac9, 0e6cdb6 |
| UX-24 light mode loses surfaces | Fixed where reported: sign-in card, contrast card | d383288, cf76ac9 |
| UX-25 asset filters | Fixed: labelled Type/Status/Tags rows, sideways on phone; counts match; empty boxes read empty | cf76ac9, a3d019c |
| UX-26 analysis chips and phone | Fixed: chips only when a section differs; section strip on phone | 6dd1c9a |
| UX-27 billing contradicts itself | No change now: billing UI is paused with PayPal (your 19 Nov call) | — |
| UX-28 new brand has no way back | Fixed: All brands link, label, client placeholder | ebdcef1 |
| UX-29 board cuts off a column | Fixed: six stages fit from 1280px; one-line intro | 262081e |
| UX-30 signup role selection | Fixed: Continue waits for a choice (cards stay unselected on purpose) | ff63617 |
| UX-31 dark label on blue buttons | No change: deliberate, white on #0099FF is 3.0:1 | — |
| UX-32 Arabic in tracked mono | Fixed: interface font for Arabic meta, Western digits | cf76ac9 |
| UX-33 answered questionnaire lacks context | Fixed: names the form and studio, singular address | 821065e |
| UX-34 departments switch and phone | Fixed phone header; switch knob is the same contrast decision as UX-31 | cd2b3ed |
| UX-35 notifications loud | Fixed: unread by surface, weight and dot (spec §6.14) | 885795b |
| UX-36 admin repeats itself | Fixed in the CMS: no repeated welcome, primary New article, helpful empty state | 4adf4f5 |
| UX-37 button weight | Fixed on Drafts (Accept primary) | 04ae4bd |
| UX-38 sign-in footer links | Fixed: on the baseline; Forgot password? | 899ce0f |
| UX-39 tab dots unexplained | No change: the dots already carry "Nothing here yet" as label and tooltip | — |
| UX-40 share link language | Fixed: ?lang is respected; otherwise the brand language the studio chose (Settings says so) | 2725068 |

All unit tests (768) and the full e2e suite (30) pass on the merged branch.

## Summary

- **Overall score: 5.5 / 10.** 46 screens × 4 variants (English light and Arabic dark, at 1440px and 390px) = 208 screenshots, across 5 roles: public, studio, company, client and admin.
- **One P0:** invited clients can't see their brand. The server leaves `team` out of the brand reply for clients, and the app works out the role from `team`, so the brand is filtered out (UX-01).
- **The weak spots** are phone layout (no studio phone menu; builder, Discovery, Team and moodboard break), Arabic finishing (leftover English, bidi-scrambled values, wrong terms) and consistency (page headers, field styles, public pages that each look slightly different).
- **Strong already:** desktop, dark mode, RTL mirroring, empty states on company Discovery and Moodboard, cited AI analysis, and accessibility basics (3 axe rule failures across 104 desktop scans, one h1 per page, no sideways overflow).

## Scores (1–10)

| Area | Clarity | Navigation | Consistency | Arabic & RTL | Dark | Phone | States | Copy |
|---|---|---|---|---|---|---|---|---|
| Public pages & sign-in | 6 | — | 4 | 4 | 4 | 7 | 5 | 6 |
| Account level (brands, people, admin) | 6 | 4 | 6 | 7 | 8 | 5 | 6 | 5 |
| Brand: identity & builder | 6 | 6 | 5 | 5 | 7 | 4 | 5 | 6 |
| Brand: discovery, moodboard, team | 6 | 6 | 5 | 5 | 7 | 3 | 6 | 6 |

Accessibility scan: 8 (axe WCAG 2.1 AA: contrast on an 11px tab count on Assets and Visual identity; `aria-*` attribute on moodboard `figure` items). Speed: 8 (median 1.2s to network idle; the Colour tab took 9.3s once on first load).

## Findings

### P0

**UX-01 · Invited clients can't see their brand** (Flow; Client /brands and /w/nadeen-studio/*)

- What: The server leaves the brand's team list out when a client reads it, and the app works out the person's role from that list. Role comes out empty, so the brand is filtered out of the list, and /w/… redirects to an empty /brands.
- Fix: Read the reader's role from the server's role field (already in every brand reply) instead of from the team list, and add an e2e test that signs in as a client.
- Code: `apps/brands/services.py to_document · src/lib/data/access.ts roleOn · AppContext myWorkspaces`
- Evidence: `client__brands__en-light-desktop.png`

### P1

**UX-02 · ~~The studio shell has no navigation on phone~~ (corrected)** (Phone; Brands, People, Board, Account, Questionnaires)

- What: On checking, the links are in the avatar menu on phone. The real problem was the reverse: the menu also listed them on desktop, duplicating the top bar.
- Fix: Done in f927fbb (menu links on phone only). A visible menu label on phone could still help people find them.
- Evidence: `studio__people__en-light-phone.png`

**UX-03 · Discovery questionnaire rows break on phone** (Phone; /w/…/discovery)

- What: The title disappears, the date and client wrap one word per line, and Copy link and Actions are pushed outside the card.
- Fix: Stack each row: title and meta, then status, then a full-width Copy link with Actions in an overflow menu.
- Evidence: `studio__w_nadeen-studio_discovery__en-light-phone.png`

**UX-04 · The builder top bar overlaps on phone** (Phone; /w/…/builder)

- What: "2 to fix", the device toggle, View and EN/ع are drawn on top of each other. The brand name and back button are gone and the preview is cut off.
- Fix: Below 720px, collapse the bar to back, title, Publish and a menu, and fit the preview to the screen width, or show a "best on desktop" notice.
- Evidence: `studio__w_hala-kitchens_builder__en-light-phone.png`

**UX-05 · The moodboard canvas is unusable on phone** (Phone; /w/…/moodboard/seed-mb)

- What: It opens at desktop zoom, so about 1.5 images show and the Palette and Notes zones are off-screen. The zoom toolbar is clipped and "Delete board" floats as loose text. On desktop the right-hand zones are also cut off on first load.
- Fix: Open in List view (or fit all zones) on phone, put the toolbar actions in a menu, and fit every zone into view on first load.
- Evidence: `studio__w_nadeen-studio_moodboard_seed-mb__en-light-phone.png`

**UX-06 · Team roles can't be changed on phone** (Phone; /w/…/team)

- What: The role dropdown and remove button are pushed off the card edge, and long emails break in the middle.
- Fix: Stack each member: name and email, then role and actions on their own row.
- Evidence: `studio__w_nadeen-studio_team__en-light-phone.png`

**UX-07 · Clients get the studio's home** (Flow; /brands as client)

- What: "Your clients' brands", a New workspace button and card, "0 shared with clients" and the Board link all appear, and none of them apply to a reviewer.
- Fix: Give clients a "Brands shared with you" home with no create actions and no Board.
- Evidence: `client__brands__en-light-desktop.png`

**UX-08 · A developer note is shown to customers** (Copy; Account › Organisation)

- What: The SSO card says: "Enterprise procurement checkbox — needs WorkOS or Auth0 wired up for real", in both languages, next to a working switch.
- Fix: Hide the card, or disable it with "Available on Enterprise. Contact us to set it up."
- Code: `src/features/account/components/organisation/sso-section.tsx:16`
- Evidence: `studio__account_tab_organisation__en-light-desktop.png`

**UX-09 · The 404 page is the stock Next.js page** (Public; Any unknown URL)

- What: No logo, no tokens and no way home. It is always light and always English. In Arabic it breaks: the full stop jumps to the start and "404" runs into the text.
- Fix: Add a branded not-found page from the kit's empty state (icon, one line, "Go to home"), bilingual and theme-aware.
- Evidence: `public__this-page-does-not-exist__ar-dark-desktop.png`

**UX-10 · The guideline password gate ignores theme and language** (Public; /v/nadeen-studio (locked))

- What: It is always dark, English and LTR, with no EN/ع toggle and no studio logo, so a client arriving from an email sees a padlock and a name.
- Fix: Follow the visitor's theme and language, add the toggle, and show the studio logo.
- Evidence: `public__v_nadeen-studio__en-light-desktop.png`

**UX-11 · The questionnaire looks like a different product** (Public; /f/…)

- What: It has its own grey canvas, a boxed card, a square language toggle, a darker blue and no dark mode. It opens in the form's language, so the English title sits right-aligned above Arabic text.
- Fix: Rebuild the /f/ shell from the same pieces as login and /s/ (tokens, pill toggle, primary button), and set the title's own direction.
- Evidence: `public__f_1Zv3lL6Abfxk6dppFYhgbo-DDl61NQGb1hVDDJJ41fw__en-light-desktop.png`

**UX-12 · Leftover English and scrambled values in Arabic** (Arabic; Analysis, Drafts, Builder, Assets, Colour, Type sandbox)

- What: Untranslated: Edit, Founded, Budget, Next opening and "Form · Q1" on Analysis; the raw keys who-for and why-you on Drafts; "Sign off Overview" and "Quote" in Builder; PHOTO and LOGO on Assets. Scrambled by text direction: "0.020em-", "f3f5f7 on #090909#", "v/hala-kitchens/", "K⌘". The relative time "قبل 1 ي" is not natural Arabic.
- Fix: Move the strings into the ar dictionary, wrap values, paths and shortcuts in <bdi dir="ltr">, and spell out time units (قبل يوم).
- Evidence: `studio__w_nadeen-studio_analysis__ar-dark-desktop.png`

**UX-13 · The builder shows three statuses at once** (Flow; /w/…/builder)

- What: "Published", a green "Ready to publish" and a grey "Update" that looks disabled appear together, so you can't tell whether there are unpublished changes. The preview also shows editor placeholders and a blank logo pill.
- Fix: Show one status ("Published · no changes" or "3 unpublished changes" with an active Update), and preview only the real content.
- Evidence: `studio__w_nadeen-studio_builder__en-light-desktop.png`

**UX-14 · "Add English version" in the Arabic UI** (Arabic; Overview (studio and company))

- What: The button follows the interface language, not the content. With English content already written, the Arabic UI offers to add English.
- Fix: Label it from the missing content language.

**UX-15 · Brand files duplicates Assets** (Flow; Visual identity, Assets)

- What: Visual identity › Brand files is the Assets page copied in full: same description, same filters, same upload. Two sidebar items lead to the same library.
- Fix: Drop the tab, or make it a logos-only view with a "Go to all assets" link.

### P2

**UX-16 · The sidebar cuts off its last items** (Consistency; All brand pages)

- What: At 900px height "Team & history" is half hidden behind the user footer, with no sign the list scrolls. On Settings the active item isn't visible at all.
- Fix: Scroll the active item into view and add a fade at the cut-off, or tighten row spacing so the list fits.
- Evidence: `studio__w_nadeen-studio_visual-identity_tab_logo__en-light-desktop.png`

**UX-17 · Fields are filled boxes, not the kit underline** (Consistency; Several pages)

- What: Overview (Industry, Tagline, Founded), Strategy (Purpose), Departments, Settings, Team, the Assets search and the People filter use grey filled boxes. The spec and the field rule say underline only.
- Fix: Move them to the kit Input and SelectField.
- Evidence: `studio__w_nadeen-studio_strategy__en-light-desktop.png`

**UX-18 · Every page header is different** (Consistency; All pages)

- What: The h1 sits at y≈153 to 333 depending on the page. Content width ranges from 660px to full width. Strategy and Compliance put their tabs and toolbar above the h1, and the main action changes style and place from page to page.
- Fix: Use one PageHeader (breadcrumb, then tabs, then h1, description and actions at the inline end), and one width per page type.

**UX-19 · The brands home buries the brands** (Flow; /brands)

- What: A welcome card, then four stat tiles that repeat each other (All 3 / Owned 3), sit above the grid. "Shared with you 0" sits next to "1 shared with clients", which reads as a contradiction. On phone no brand shows on the first screen.
- Fix: Lead with the h1 and the grid, and cut the stats to one line.
- Evidence: `studio__brands__en-light-desktop.png`

**UX-20 · The same thing goes by several names** (Copy; Product-wide)

- What: brand / workspace; questionnaire / form; Type sandbox / مختبر الخطوط (Type lab); Guidelines editor / Guideline site; colour / color. In Arabic: أرسل (an imperative) where مُرسَل is meant, الفريق والإصدارات for Team & history, and "6 لون" where the plural is 6 ألوان.
- Fix: Settle one term per concept in the Phase 6 copy guide and apply it in both languages.

**UX-21 · An empty brand doesn't say what to do first** (Flow; Hala Kitchens overview, strategy, builder)

- What: The setup steps don't look clickable, the only button is "Add Arabic version", Strategy opens on ten tabs with no main action, and Builder shows a red "2 to fix" with no explanation.
- Fix: Make each step a link with a chevron and promote the next step to the main action. "2 to fix" should open its list.

**UX-22 · The side-by-side logo preview is blank** (Flow; Visual identity › Logo)

- What: "Both lockups, side by side" shows empty tiles even though the Latin lockup and the mark are uploaded.
- Fix: Show the lockup that exists and a clear "Arabic lockup missing" placeholder for the other.
- Evidence: `studio__w_nadeen-studio_visual-identity_tab_logo__en-light-desktop.png`

**UX-23 · Secondary panels push the main content down** (Flow; Colour, Overview)

- What: On Colour the contrast audit fills the first screen and the swatches start at the fold (on phone they don't appear on the first screen at all). On Overview a checklist that is already 5/5 still takes half the screen.
- Fix: Put the palette first and collapse the audit into a one-line summary. Hide the checklist once it is complete.

**UX-24 · Light mode loses card surfaces** (Consistency; Visual identity, /s/, sign-in)

- What: The logo, colour and type panels, the share-link value cards and the sign-in form sit on cards in dark mode but float with no surface in light mode.
- Fix: Give them the same SurfaceCard hairline in light mode.

**UX-25 · Asset filters run together** (Flow; Assets)

- What: Type, status and tag chips sit in unlabelled rows. The sidebar says 16 while the All chip says 18. On phone there are five rows of chips before the first asset, and unchecked boxes look checked.
- Fix: Group the filters into Type, Status and Tags dropdowns, use one Filters button on phone, and make the counts match.

**UX-26 · Analysis on phone shows navigation, not analysis** (Phone; /w/…/analysis)

- What: On phone the ten-row section list with identical "Ready" chips fills the first screen. On desktop all ten chips are the same, which hides the sections that changed.
- Fix: Use a tab strip or select on phone, and show a chip only when a section isn't ready.

**UX-27 · The billing tab contradicts itself** (Flow; Account › Subscription)

- What: The current plan is tagged Project Pass, but the card below says "Studio plan $29/month". The card ends with "PayPal payments aren't set up yet" and no action, and it repeats for every brand.
- Fix: Show one current-plan row per brand with one action, and say "Payments open soon".

**UX-28 · New brand has no way back** (Flow; /brands/new)

- What: No back or cancel link, no field label, the studio's own name as the placeholder, and a grey button that looks disabled.
- Fix: Add "Back to brands", a "Brand name" label, a client-like placeholder and a primary button.

**UX-29 · The board cuts off its last column** (Consistency; /studio/board)

- What: "Delivered" is cut off at 1440 with no scroll cue, the page runs full width unlike every other studio page, and the intro copy argues with itself ("not a CRM").
- Fix: Fit five columns or add scroll cues, use the standard width, and cut the intro to one line.

**UX-30 · Signup roles have no selected state** (Public; /signup)

- What: The three role cards show no selected state, yet Continue looks enabled.
- Fix: Preselect Studio or show a checked state, and disable Continue until a role is chosen.
- Evidence: `public__signup__ar-dark-desktop.png`

**UX-31 · Dark-mode primary buttons use black text** (Consistency; Login, signup, gate)

- What: The blue primary has a black label in dark mode and a white one in light mode. The spec sets white on the accent.
- Fix: Use --text-on-primary in both themes.

**UX-32 · Arabic set in tracked monospace** (Arabic; Logo, Typography)

- What: Arabic meta text uses the letter-spaced mono style, which breaks letter joins, and the type-scale meta switches to Arabic-Indic digits.
- Fix: Use IBM Plex Sans Arabic with no tracking for Arabic meta text, and keep Western digits.
- Evidence: `studio__w_nadeen-studio_type-lab__ar-dark-desktop.png`

**UX-33 · The answered-questionnaire screen lacks context** (Public; /f/… after submit)

- What: It doesn't say which form was answered, when, or by whom it was sent. It addresses the client in the plural while the start screen uses the singular.
- Fix: Show the form title, date and studio, and use one form of address.

**UX-34 · The departments switch reads as off in RTL dark** (Arabic; Departments)

- What: The knob is black on a blue track, so the switch looks off when it is on. On phone the section actions squeeze the heading into five lines.
- Fix: Use the kit knob colour, and stack the actions on phone.

### P3

**UX-35 · Notifications are loud and time formats vary** (Consistency; Notifications, admin)

- What: Each unread card is fully tinted with its own Mark as read link, and there is a manual Refresh button. Times read "2 minutes ago", "2m" and "13m ago", and admin dates are US-style ("Nov 14").
- Fix: Mark unread with a dot and heading weight, refresh automatically, and use one date and time formatter.

**UX-36 · Admin pages repeat themselves** (Consistency; /admin/*)

- What: The welcome card appears on both Dashboard and CMS, and Users shows its title three times. The CMS bar says "All content" while its h1 says "Website content", and its empty state has no action.
- Fix: Drop the repeats, match the bar to the h1, and make New article the empty state's primary action.

**UX-37 · Button weight doesn't match importance** (Consistency; Drafts, Discovery, Team)

- What: Accept and Reject on Drafts look the same, company Discovery has two primary buttons, "+ Invite" uses a typed plus sign, and buttons are about 36px tall against the spec's 46px.
- Fix: One primary per view, outline for the other, kit icons, and kit sizes.

**UX-38 · The sign-in footer links look loose** (Public; Login, signup)

- What: "New here? Create an account" sits on two baselines, and "Forgot?" floats inset from the field and is vague.
- Fix: Write each as one inline sentence, align the link to the field edge and call it "Forgot password?".
- Evidence: `public__signup__ar-dark-desktop.png`

**UX-39 · Tab dots have no explanation** (Flow; Visual identity, Strategy)

- What: The small rings on tab labels ("empty" or "needs Arabic") are never explained, and Strategy's ten tabs wrap onto two rows.
- Fix: Give the dots a tooltip or legend, and turn Strategy into a vertical section list.
- Evidence: `studio__w_nadeen-studio_strategy__en-light-desktop.png`

**UX-40 · The share link stays in English for Arabic visitors** (Public; /s/…)

- What: /s/ opens in English and LTR whatever the visitor's language; only its own toggle changes it.
- Fix: Default to the visitor's language when the brand has that content.
- Evidence: `public__s_seedshare1795196879170__en-light-desktop.png`

## Recommended order

1. **This week:** UX-01 client role, UX-08 SSO note, UX-02 studio phone menu, UX-09 404 page, UX-12 Arabic leftovers and `<bdi>`.
2. **Next 2–3 weeks:** phone layouts UX-03 to 06; one PageHeader and underline fields UX-17/18; questionnaire and password gate from the kit UX-10/11; one builder status UX-13.
3. **After that:** client home and a simpler brands home UX-07/19; terminology with the Phase 6 copy guide UX-20; merge Brand files into Assets and group filters UX-15/25; empty-brand onboarding UX-21.

## Method

- Production build (`next build --webpack`) against an isolated backend, seeded with a studio with 3 brands (one full, one empty), uploaded images, a moodboard, a published guideline, two questionnaires (one answered), an AI analysis, a client reviewer, a company account and an admin.
- Playwright captured every route in 4 variants and recorded the visible h1, sideways overflow, console errors, load time and axe WCAG 2.1 AA (desktop).
- Four reviewers each took one area, and every P0/P1 was checked against the screenshot or the code. Dropped: a "missing" reset page (the real route is `/reset`) and a wrong brand heading that came from the seed data.
