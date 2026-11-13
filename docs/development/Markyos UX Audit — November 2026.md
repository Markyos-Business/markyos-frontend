# Markyos UX Audit — November 2026

> Original supplied audit, retained as historical observations. Current validation, implemented changes and the confirmed pricing decision are documented in [November audit follow-up](NOVEMBER_AUDIT_FOLLOWUP.md).

Nov 12, 2026 · Prepared for @Abdullah

## Summary

**Overall score: 5 / 10.** The foundations are strong: the Arabic copy reads as if it was written in Arabic first, the logo system really is bilingual, and tools like the text checker and moodboard starters show real product thinking. The journey around them is what pulls the score down. A new user lands in an empty brand with 13 sidebar items, no guidance, three menu items that lead nowhere, and copy written for a different account type. The core differentiator, native Arabic, is hurt by a font bug that makes most Arabic headings render in Arial.

Fix the font, the dead ends and the first-run path, and this moves to a 7 without any new features.

**Scope.** Reviewed in your browser on Nov 12, 2026, at desktop width (962 × 666), signed in as a Company account with one empty brand ("Markyos"). The Arabic interface was reviewed in full; English and dark mode were spot-checked. Public screens covered: sign in, sign up (both steps), validation and the unpublished guideline page. **Not covered:** mobile and tablet widths, real file uploads, publishing, Google sign-in, Studio and Freelancer accounts, inviting people.

## Scorecard

| Area | Score | In one line |
| --- | --- | --- |
| First impression and clarity | 6 | Clean, calm, credible. The purpose of each page is clear once you're on it. |
| Onboarding and activation | 3 | No first-run path. The empty brand gives no next step. |
| Navigation and information architecture | 4 | 13 flat items, the asset manager is hidden in a tab, four different page shells. |
| Bilingual and RTL quality | 5 | Great intent and copy, undermined by the font bug, English leftovers and English-first ordering. |
| Visual consistency | 5 | Three primary button styles, duplicated titles, overflowing toolbars and tab strips. |
| Feedback, empty states and errors | 5 | Some excellent empty states, some dead ends, one misleading "No issues". |
| Copy and voice | 6 | Strong voice. Developer language leaks into feature copy. |
| Fit to account type | 4 | A Company account is addressed as a studio throughout. |
| Accessibility | 5 | Visible focus ring and labelled controls, but tabs lack semantics and some text is small. |

## What works well

- **Switching language keeps your place.** On sign-up step 2, switching to English kept the step and the selected account type, and the layout mirrored correctly.
- **Arabic copy is native.** Lines like «علاماتك وأدلتك، وكل ما شُورك معك.» feel written, not translated. This is rare and worth protecting.
- **The logo system shows the product's point.** Separate Arabic and Latin lockup slots plus a shared mark is the bilingual differentiator made visible.
- **The moodboard empty state is the best screen in the product.** It offers five starting directions (new identity, redesign, sub-brand, campaign, digital product), each explaining what it includes. Every empty state should work like this.
- **The text checker explains Arabic-specific checks** (Arabic punctuation, kashida, mixed numerals, bidi order) and says plainly that nothing leaves the browser.
- **Reassuring settings copy.** "Renaming won't break any link you've shared" removes a real fear at the moment it appears.
- **Strategy has a clear rhythm:** one section at a time, "1 of 10" and a Next button.
- **Form basics are right:** inline validation, visible focus ring, show-password toggle, and an explanation under "Keep me signed in".

## Critical findings

These block activation or damage the core promise. Fix first.

### C1. Most Arabic text renders in Arial, not IBM Plex Sans Arabic

**Where:** sign in, sign up, the brands list, and every page heading (h1) inside a brand.

**What happens:** the font stack is `Inter, "Inter Fallback", Inter, "IBM Plex Sans Arabic", …`. "Inter Fallback" is the size-adjusted local Arial that Next.js generates. Arial contains Arabic letters, so the browser uses it for every Arabic word and never reaches Plex. The sidebar uses a different stack with Plex first, so one screen can show two different Arabic fonts. Arabic also comes out visually smaller than the English at the same settings.

**Why it matters:** native Arabic is the product's main reason to exist. Thin, cramped Arial headings make the Arabic look like a fallback, which is the exact problem Markyos claims to solve.

**Fix:** for `[dir="rtl"]` / `:lang(ar)`, put `IBM Plex Sans Arabic` first in one shared stack (or give Plex an Arabic `unicode-range` and list it before Inter everywhere). Apply that one stack to headings, body text and form controls. Then retune the Arabic type scale: about +1px on body and labels, and a slightly taller line-height.

### C2. No first-run path

**Where:** the brands list and the brand overview after sign-up.

**What happens:** the user lands on one brand card ("MA", "Draft · empty") and then a 13-item sidebar. The "Brand insights" panel lists 0/3, 0, 0/2, 0/8, but none of the rows can be clicked.

**Why it matters:** with no obvious first win, most new users will look around and leave. Time to first published guideline is the metric that matters, and nothing on screen moves the user toward it.

**Fix:** turn Brand insights into a setup checklist where each row links to its step: upload logos → add colours → set fonts → write purpose → publish. Show the same progress on the brand card ("2 of 5 done") instead of "Draft · empty". Optionally offer "Start from a template" right on the empty brand.

### C3. Three menu items lead to dead ends

**Where:** Discovery and Analysis in the brand sidebar, and Forms (الاستبيانات) in the top navigation.

**What happens:** all three show "Discovery forms need the Markyos server". Analysis shows the Discovery message word for word, so it also explains the wrong feature.

**Why it matters:** Discovery and Analysis are the first two items under Overview, so they're likely the first things a curious user clicks. Two dead ends in a row read as "this product doesn't work yet".

**Fix:** hide them until they work. If they need to stay visible, label them "Coming soon" in the sidebar and use a proper preview state on the page: what the feature does, a screenshot, and a "Notify me" action. Give Analysis its own copy.

### C4. A Company account is spoken to as a studio

**Where:** throughout the product.

**What happens:** examples include "0 shared with clients" on the brands list, "Client access" and "brand.yourstudio.com … your agency's link" in settings, "Client approval" and "invite a client viewer" on Team, "Studio board" in the top nav, "Its studio will share it" on the public page, the type lab sample "Brand governance for studios…", and the sign-up subtitle about "client links you send".

**Why it matters:** your positioning rule is that a company must never feel it needs a studio. Right now the product tells a company user, page after page, that it's a client of someone else.

**Fix:** add an account-type layer to copy (Studio / Freelancer / Company variants of the same keys). For companies, rename client features to team or partner language ("Share with your team", "Partner access"), hide studio-only modules (Studio board), and write the public page as "This brand guideline hasn't been published yet."

## High-priority findings

### H1. The asset manager is hidden, and the sidebar mixes five kinds of things

Pillar 1, the asset manager, exists only as the first tab ("Brand files") inside Visual Identity. It isn't in the sidebar at all, even though the product is built on the rule that everything references it. The sidebar's 13 items mix workflow steps (Discovery, Analysis, Moodboard), content (Visual identity, Strategy, Departments), output (Guidelines editor), tools (Type lab, Compliance, Drafts) and admin (Team, Settings). At 666px height, Team and Settings fall below the fold.

**Fix:** group the sidebar around the three pillars plus publishing:

- **Assets**: the file manager, top-level
- **Identity**: logo, colour, type, patterns, graphics, illustration, icons
- **Strategy**: purpose to tone, with Departments nested
- **Guideline site**: editor and publish
- **Tools**: type lab, compliance, drafts
- **Research** (Studio only): discovery, analysis, moodboard

Pin Team and Settings to the bottom of the sidebar so they're always visible.

### H2. Four different page shells at account level

- `/brands` has the logo, search, nav links and avatar.
- `/people` and `/forms` have only a "→ Brands" back link and the avatar.
- `/studio/board` has its own header with Brands and Board links.
- `/templates` has a "< Brands" chevron breadcrumb and no avatar.

Users lose their sense of where they are each time they move between these pages. **Fix:** one global header on every account-level page, with the current section highlighted.

### H3. Tabs overflow, don't change the URL, and aren't real tabs

Visual Identity has 8 tabs and Strategy has 10. Both scroll sideways with a visible scrollbar at desktop width. The URL never changes, so you can't link to the Colours tab, a refresh sends you back to the first tab, and the browser Back button leaves the page entirely. The tabs are plain buttons with no `role="tab"`.

**Fix:** give each tab its own route (`/visual-identity/logo`). For more than five items, use a nested sidebar list or vertical sub-navigation instead of a horizontal strip. Add `tablist`/`tab` semantics for screen readers.

### H4. The Strategy header overflows

Share, "Fill Arabic from English", Edit/Read, "Import from file", the theme switch, the language switch and the avatar don't fit. The theme switch is cut off and the language switch and avatar are pushed off-screen.

**Fix:** put page actions in the page's own header row with one primary action and the rest in a "⋯" menu. Show language and theme in one place only: the account menu already has a language switch, so the duplicate controls can come out of every page header.

### H5. English leftovers and broken text direction in the Arabic UI

- Logo tab: "Drop SVG or PNG", "or click to browse · 10 MB max", and "Used in the rail, favicon and small sizes", in a monospace font with the full stop pushed to the start of the line (".sizes").
- Colours tab: "Add color". Logo tab: "shared".
- Overview editor: "words 0", in reversed order.
- Public guideline link: the whole "Not published yet" page is in English, though the brand's language is Arabic.

**Fix:** add a lint check or a check in your tests that fails on hard-coded UI strings. Wrap mixed-direction text in `<bdi>` or `dir="auto"`. Public pages should follow the brand's language setting.

### H6. In-app pricing doesn't match your plan notes

Settings shows Project Pass at $49 one-time and a Company plan at $99/month. The pricing model in your notes is Project Pass $19, Pro $24/month and Studio $59/month. Confirm which is current and drive both the app and the site from one source. Settings also shows "Saudi payment methods: planned for v3.0 (Tap, HyperPay, Moyasar)", a roadmap item you've since dropped. Roadmap promises in the UI become broken promises. Billing also lives in two places (brand settings and Account → Subscription & payments). Pick one.

### H7. Upgrading is a dead end

The brands list shows a disabled "New workspace" button and a locked card: "Company accounts own up to 1 brand. Contact Markyos to change your plan." There is no link, no plan comparison and no checkout. A user ready to pay has nowhere to go. **Fix:** make the card itself a button to a plan comparison with Stripe checkout, and explain the disabled button with a tooltip.

## Medium findings

| # | Finding | Fix |
| --- | --- | --- |
| M1 | Developer language in feature copy: "references these files by ID", "roles aren't a security boundary yet, every check runs in the browser", "DNS and hosting aren't available yet", "the webhook doesn't send anywhere yet". | Explain the local-only beta once, in a dismissible banner. Keep feature copy about the user's benefit. |
| M2 | The guideline editor shows "No issues" next to Publish while logos, colours and strategy are all empty. | Add a pre-publish checklist of missing essentials, and warn before publishing an incomplete guideline. |
| M3 | The floating Publish bar sits over the bottom-left of the preview and covers content. | Move publishing into the editor's top bar, or reserve space for the bar. |
| M4 | The product is Arabic-first, but the text checker puts English first, and the fill action only goes "Arabic from English". | Arabic field first in the Arabic UI. Offer both fill directions. |
| M5 | Three primary button styles: blue (sign in, People), black pill (workspace), white pill (dark mode). Your design system says one accent blue. | One primary-button token used everywhere. |
| M6 | The sort button on the brands list silently cycles between "Last edited" and "Name A–Z". | Use a dropdown, like the "Newest ▾" control in Brand files. |
| M7 | The colour compliance check runs with zero approved colours, so it compares against nothing. | Show "Add your brand colours first" with a link to Colours. |
| M8 | Titles are duplicated: "Overview" twice on Overview, and "Visual identity" in the bar above "Brand files". | Breadcrumb in the top bar, one h1 per page. |
| M9 | The brand card shows "MA" as initials for a brand called "Markyos". | One initial, or the uploaded mark once there is one. |
| M10 | "Download files" is active on an empty logo page, and the Latin lockup card is outlined in blue for no clear reason. | Disable downloads until there's a file. Reserve the blue outline for focus or selection. |
| M11 | The type lab, a design tool, sits under Governance. | Move it to Tools or Identity → Typography. |

## Sign-in and sign-up

| # | Finding | Fix |
| --- | --- | --- |
| A1 | On sign-up, "Continue with Google" appears before the account-type question, so Google sign-ups probably skip that choice. (The build is local-only, so the Google button may not work at all.) | Ask the account type first, then offer Google or email. Hide Google until it works. |
| A2 | Account-type descriptions only appear after you pick one, so users choose without knowing the difference. | Show a one-line description on all three cards up front. |
| A3 | An empty email field shows "Enter a valid email". | "Enter your email" when empty, "That email doesn't look right" when it's malformed. |
| A4 | The password placeholder "••••••••••" looks like a saved password. | Remove the placeholder. |
| A5 | Tab order goes Email → "Forgot?" → Password. | Put the Forgot link after the password field in the page code. |
| A6 | A confirm-password field, even though there's a show-password toggle. | Remove the confirm-password field. |
| A7 | The language switch scrolls away on long forms. | Keep it fixed in place, or repeat it at the bottom of the form. |

## Accessibility notes

- The visible focus ring and labelled inputs are good. Keep them.
- Tabs need `tablist`/`tab`/`aria-selected` semantics (see H3).
- Arabic helper text renders at about 12–13px in Arial (see C1). Under the fixed font, check contrast on grey text, especially placeholders on grey input fields.
- Numbers in Brand insights use a monospace Latin font inside Arabic sentences. Use Plex's numerals or tabular numbers in the main font.

## Action plan

**This week (small effort, big lift)**

1. Fix the Arabic font stack and retune Arabic sizes (C1).
2. Hide Discovery, Analysis and Forms, or mark them "Coming soon" (C3).
3. Translate the leftover strings and fix the direction bugs (H5).
4. Quick form fixes: A3, A4, A5 and A6.
5. Small consistency fixes: M6, M7 and M8.

**Next 2–4 weeks**

1. Setup checklist and progress on brand cards (C2).
2. Copy variants by account type (C4).
3. One global header (H2), tabs with their own routes (H3), a page header that fits (H4).
4. Self-serve upgrade (H7), pre-publish checklist (M2), one primary button (M5).

**Later**

1. Restructure the sidebar around the three pillars (H1).
2. One source of truth for pricing, with billing in one place (H6).
3. Audit mobile and tablet. Clients will open published guidelines on phones.
4. Run a moderated test with five people (three studios, two in-house teams) on three tasks: create a brand, add a logo and colours, publish and share.

## What to measure

- **Time to first published guideline** from sign-up (the main activation metric).
- **Setup completion:** share of new brands with logos, colours and fonts added in the first session.
- **Dead-end clicks:** visits to unfinished features (should reach zero after C3).
- **Upgrade attempts** on the locked card (shows how much demand H7 is turning away).
