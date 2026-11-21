# User dashboards

The signed-in home at `/brands` and each brand's `/w/[slug]/overview` use the shared Markyos dashboard widgets. The admin dashboard remains a separate experience.

## Portfolio home

DashboardHeader supplies the account-type-specific title, sorting and existing new-brand/plan-limit action. Four MetricCards describe the full set of brands the current account can access:

- All brands: the `myWorkspaces` collection, after existing access checks.
- Owned by you: those whose ownerAccountId matches the current session account.
- Shared with you: accessible brands owned by another account.
- Published guidelines: accessible brands with a saved publication snapshot. A publication does not bypass password or link-access settings.

These are current counts, not historical activity or growth figures. Search filters the cards while the overview totals remain account-wide. Sorting, ownership limits, account-type onboarding and server authorization retain their existing behavior.

Brand cards use DashboardCard and CardFooterStats with the saved logo/initials, draft/shared state, latest edit time, actual setup completion and the viewer's role. Each card links to its existing brand overview. No admin-only data endpoint is used.

## Brand overview

DashboardHeader and DashboardCard frame the existing editable brand details. ProgressCard composes a TaskList checklist from the existing `brandSetup` helper: logo, colors, typography, purpose in the primary document language, and publication. The checklist preserves its original feature links and template shortcut.

ProgressCard accepts optional children for checklists or other detail below its progress summary; block content is not placed inside a paragraph. The rich-text overview keeps its existing controls, autosave and saved content. A minimum editor height keeps it usable after the cards stack on phones.

The widget provider follows the interface language, while setup completion continues to follow the brand's primary document language. Existing permissions continue to control editing and publication.

## Validation

Verified in English/Arabic at 390px and 1440px with disposable API accounts and real synthetic brand documents. Checks cover account-scoped totals, invited viewer branding, search, private-brand isolation, card navigation, setup links/progress, no horizontal overflow, and rich-text save/reload persistence. The full frontend suite and production build should be run when changing these shared compositions.
