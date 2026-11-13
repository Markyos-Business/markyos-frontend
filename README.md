# Markyos platform

The bilingual Markyos application for managing brand strategy, visual identity,
discovery, guideline sites, and client review. This is the Next.js frontend;
`../markyos-backend` provides the Django API and `../landing-frontend` is the
separately deployed marketing website and Payload CMS.

## Development documentation

Start with these guides before adding or changing a feature. They describe the
current implementation, distinguish browser-only behavior from API-backed
behavior, and identify incomplete integrations and inconsistent older guidance.

| Guide | Use it for |
| --- | --- |
| [UI documentation](docs/development/UI.md) | Colors, typography, spacing, components, forms, tables, navigation, responsive behavior and accessibility. |
| [UX documentation](docs/development/UX.md) | Roles, journeys, route flows, recipient experiences, loading/empty/error/success states and save feedback. |
| [Functional documentation](docs/development/FUNCTIONAL.md) | Modules, permissions, business rules, persistence, concurrency, workflows, integrations and implementation limits. |
| [November audit follow-up](docs/development/NOVEMBER_AUDIT_FOLLOWUP.md) | Finding-by-finding validation, fixes, preserved pricing decisions and verification limits. |

Last reviewed: 12 November 2026. Update the relevant guide in the same change as
its behavior. Runtime code takes precedence when older docs or design exports
disagree; record the discrepancy rather than silently treating a prototype as
a completed feature.

## Run locally

Use a Node version supported by the installed Next.js and Prisma packages.

```sh
npm ci
npm run dev
```

Without `NEXT_PUBLIC_API_URL`, the app uses browser-local demo accounts/data.
This mode is useful for UI work but does not provide shared accounts, portable
client links, real payment, or server authorization.

For the integrated application, configure the frontend's API base and start the
Django service from its own repository:

```sh
# Example frontend .env.local value; restart/rebuild after changing it.
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Follow the [backend setup](../markyos-backend/README.md) for its environment,
database, migrations and provider configuration. CORS must allow the frontend
origin and session-cookie settings must match the deployment. Do not place
Stripe, mail, Google client secrets or LLM keys in public frontend variables.

`NEXT_PUBLIC_UI_GALLERY=1` enables `/dev/components`, `/dev/motion` and the
`/design-system` reference route. They return 404 without the flag.

## Validation

```sh
npm run test             # Vitest unit tests
npm run check            # types, lint, Prisma schema, tests and UI audits
npm run e2e              # integrated Playwright scenarios; see setup below
```

`check` loads `prisma.config.ts`, which requires `DATABASE_URL` and
`SHADOW_DATABASE_URL`. Prisma is currently a scaffold, not the platform's live
persistence layer; Django stores API-backed application data. Do not run Prisma
migrations against an unrelated database just to satisfy a validation command.

[E2E setup and scenarios](e2e/README.md) describe the backend Python environment,
ports, test analysis fake and provider mocks. Browser sweeps are separate
`sweep:*` scripts in [package.json](package.json); use the relevant sweep when
changing layout or interaction behavior.

## Code and supporting references

- [Routes](src/app) compose [feature modules](src/components/features), shared
  [UI primitives](src/components/ui), [forms](src/components/form) and
  [layout](src/components/layout).
- [AppContext](src/contexts/AppContext.tsx) coordinates the client state and
  [data adapters](src/lib/data/adapters); [API client](src/lib/api/client.ts)
  centralizes authenticated requests and refresh.
- [UI implementation reference](docs/ui/README.md),
  [template token contract](docs/token-contract.md), and
  [integration status](docs/INTEGRATION-STATUS.md) provide narrower background.
- [Billing](../markyos-backend/docs/billing.md),
  [approvals](../markyos-backend/docs/approvals.md), and
  [sign-offs](../markyos-backend/docs/signoffs.md) document dedicated API rules.

`project/` and `chats/` contain the original design-handoff material. They are
historical design context, not the runtime application or an instruction to
rebuild already implemented screens. The sibling `markyos-brand` folder contains
the supplied originals; runtime assets are in [public/brand](public/brand).
