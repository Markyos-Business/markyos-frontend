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

## Folder structure

```
src/
├─ app/                        routes only: thin pages that compose features
├─ components/
│  └─ ui/                      shared, reusable, no business logic
│     ├─ index.ts              exports every component ("@/components/ui")
│     ├─ registry.ts           build status of every component (npm run status)
│     ├─ <name>.tsx            a simple component is one file
│     └─ <name>/               a complex one is a folder
│        ├─ index.ts           public exports only
│        ├─ <name>.tsx
│        ├─ <name>-<part>.tsx
│        ├─ use-<name>.ts      its own hook, if any
│        └─ types.ts
├─ features/<domain>/          one folder per business area
│  ├─ index.ts                 the only file other code may import
│  ├─ components/              domain UI built from "@/components/ui"
│  ├─ hooks/                   use-*.ts
│  ├─ api/                     *.api.ts
│  ├─ schemas/                 *.schema.ts (zod)
│  ├─ types.ts
│  ├─ constants.ts
│  └─ i18n/en.json, ar.json
└─ lib/                        helpers and the API client
```

The rest of `src/` supports these: `contexts/` (the app store and its
providers), `hooks/` (generic hooks), `types/` and `constants/`. `features/shell`
is the app frame (studio sidebar, top bar, account header), which knows about
brands and accounts, so it is a feature rather than UI. [features/assets](src/features/assets)
is the reference feature for the pattern, at `/assets` with `NEXT_PUBLIC_UI_GALLERY=1`.

Rules:

1. `components/ui` never imports from `features/`.
2. Features import shared UI only from `"@/components/ui"`, never a file inside it.
3. A feature never imports another feature's internal files, only its `index.ts`.
   If two features need the same piece, move it into `components/ui` with a generic API.
4. Placement: if it knows about brands, assets, discovery or another domain, it goes
   in `features/<domain>/components`. If it would work in any product, it goes in `components/ui`.
5. One file or a folder: a component with sub-parts, its own hook or its own types
   gets a folder with `index.ts`. Otherwise it is one file.
6. Naming: kebab-case files, PascalCase components. Feature components start with
   the domain name (`AssetTable`, `BrandCard`). Hooks `use-*.ts`, schemas `*.schema.ts`,
   API `*.api.ts`.
7. Every new component in `components/ui` goes in `registry.ts` with a status
   (planned, in-progress, in-review, ready, deprecated), then `npm run status`.
   Feature components don't go in the registry.
8. Pages in `app/` contain no business logic or data fetching. They compose features.

Rules 1–3 are enforced by `npm run lint` ([eslint.config.mjs](eslint.config.mjs)).
Existing exceptions, to be removed as those areas are reworked: `src/contexts`
and `src/lib/data` still import a few feature internals (auth's API, moodboard
templates); older features keep their `copy.ts` and `utils/` rather than
`i18n/*.json`; and a few older feature components don't yet start with the
domain name.

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

## Form fields

Every field is built on one wrapper, `Field` ([src/components/ui/field/field.tsx](src/components/ui/field/field.tsx)),
so they share the label, the note under the field, the states and the look
(the underline field in [tailwind/base.js](tailwind/base.js), `.mk-field`). Import
everything from `@/components/ui`. Status and notes per component are in
[STATUS.md](STATUS.md) (`npm run status`); the gallery is `/design-system/forms`
with `NEXT_PUBLIC_UI_GALLERY=1`.

**Shared props.** `label`, `info` (an ⓘ tooltip), `hint`, `required` or
`optional`, and the states `error`, `warning`, `success`, `validating`,
`locked` + `lockedReason`, `readOnly`, `disabled` and `loading` (a skeleton).
`error` wins over `warning`, which wins over `success`. Text fields also take
`prefix`, `suffix`, `action` (a Copy or Generate button), `showCount` with
`maxLength`, `layout="horizontal"` and `size="sm"`. Every built-in word comes
from the kit's strings in English or Arabic, and each can be overridden by a prop.

| Field | Library name | Value |
| --- | --- | --- |
| `InputField` | TextInput | text, `register` |
| `TextareaField` | Textarea | text, `register`; `autoGrow`, `maxRows` |
| `EmailField`, `PasswordField` (`strength`), `SearchField` | EmailInput, PasswordInput, SearchInput | text, `register` |
| `NumberField`, `CurrencyField` (`currency="SAR"`), `PercentageField` | NumberInput, CurrencyInput, PercentageInput | `number \| null`, `Controller` |
| `UrlField` | UrlInput | full URL string, `Controller` |
| `PhoneInput` (or `PhoneField` with code and number apart) | PhoneInput | E.164 string, `Controller` |
| `SlugField` (`base`, `from`, `checkAvailability`) | SlugInput | slug string, `Controller` |
| `HexColorField` | HexColorInput | `#RRGGBB`, `Controller` |
| `BilingualField` (`layout="side" \| "tabs"`, `multiline`) | BilingualInput | `{ en, ar }`, `Controller` |
| `RichTextField` | RichTextEditor | HTML string, `Controller` |
| `OtpField` (`length` 4–6) | OtpInput | digits, `Controller` |
| `CheckboxField` (`indeterminate`, `error`, `success`) | Checkbox | `checked`, `register` |
| `CheckboxGroup` (`min`, `max`, `selectAll`) | CheckboxGroup | `string[]`, `Controller` |
| `RadioField` (`orientation`) | RadioGroup | string, `Controller` |
| `RadioCardGroup` | RadioCards | string, `Controller` |
| `ToggleField` (card, `loading`), `Switch` (compact, `loading`) | Switch | boolean, `Controller` |
| `SegmentedControl`, `SegmentedToggle` (two sides) | SegmentedControl | string, `Controller` |
| `TagInput` (`max`) | TagInput | `string[]`, `Controller` |
| `ChipSelector` (`multiple`) | ChipSelector | string or `string[]`, `Controller` |
| `DatePicker` (`weekStart`, `min`, `max`, `isDisabled`, `hijri`, `digits`) | DatePicker | `"YYYY-MM-DD"`, `Controller` |
| `DateRangePicker` (`presets`) | DateRangePicker | `{ from, to }`, `Controller` |
| `TimePicker` (`hour12`, `minuteStep`) | TimePicker | `"HH:mm"`, `Controller` |
| `DateTimePicker` | DateTimePicker | `"YYYY-MM-DDTHH:mm"`, `Controller` |
| `DurationInput` (`maxHours`) | DurationInput | minutes, `Controller` |
| `Fieldset` (`legend`, `columns`), `FieldGroup` | FieldGroup / Fieldset | — |

Text fields take react-hook-form's `register` directly; its `ref` lands on the
real input. Fields that store a number or a structured value are controlled,
so use `Controller`:

```tsx
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BilingualField, CurrencyField, EmailField, Fieldset, InputField } from "@/components/ui";

const schema = z.object({
  name: z.string().min(1, "Enter a campaign name."),
  email: z.email("Enter an email like nour@studio.sa."),
  budget: z.number({ error: "Enter a budget." }).min(1000, "The minimum is SAR 1,000."),
  title: z.object({ en: z.string().min(1, "Enter an English title."), ar: z.string() }),
});

function CampaignForm() {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", budget: null as unknown as number, title: { en: "", ar: "" } },
  });
  return (
    <form onSubmit={handleSubmit(save)} noValidate>
      <Fieldset legend="Campaign">
        <InputField label="Name" required maxLength={60} showCount {...register("name")} error={errors.name?.message} />
        <EmailField label="Contact email" {...register("email")} error={errors.email?.message} />
        <Controller name="budget" control={control} render={({ field, fieldState }) => (
          <CurrencyField label="Budget" currency="SAR" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )} />
        <Controller name="title" control={control} render={({ field }) => (
          <BilingualField label="Title" value={field.value} onChange={field.onChange} errors={{ en: errors.title?.en?.message }} />
        )} />
      </Fieldset>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</Button>
    </form>
  );
}
```

An async check (is this name or slug free?) is `validating` while it runs,
then `success` or `error` with the answer. The note is a live region, so the
result is announced; `SlugField` does this for you given `checkAvailability`.

## Code and supporting references

- [Routes](src/app) compose [features](src/features) built from the shared
  [UI kit](src/components/ui); see "Folder structure" above.
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
